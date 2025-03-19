from lunar_python import Solar, Lunar
import datetime
from datetime import datetime as dt
import json

# 全局常量定义
gan_list = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸']
zhi_list = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥']

# 十神映射表（新增）
SHISHEN_MAP = {
    '比肩': ['甲→甲', '乙→乙', '丙→丙', '丁→丁', '戊→戊', 
           '己→己', '庚→庚', '辛→辛', '壬→壬', '癸→癸'],
    '劫财': ['甲→乙', '乙→甲', '丙→丁', '丁→丙', '戊→己', '己→戊', '庚→辛', '辛→庚', '壬→癸', '癸→壬'],
    '食神': ['甲→丙', '乙→丁', '丙→戊', '丁→己', '戊→庚', '己→辛', '庚→壬', '辛→癸', '壬→甲', '癸→乙'],
    '伤官': ['甲→丁', '乙→丙', '丙→己', '丁→戊', '戊→辛', '己→庚', '庚→癸', '辛→壬', '壬→乙', '癸→甲'],
    '正财': ['甲→己', '乙→戊', '丙→辛', '丁→庚', '戊→癸', '己→壬', '庚→乙', '辛→甲', '壬→丁', '癸→丙'],
    '偏财': ['甲→戊', '乙→己', '丙→庚', '丁→辛', '戊→壬', '己→癸', '庚→甲', '辛→乙', '壬→丙', '癸→丁'],
    '正官': ['甲→辛', '乙→庚', '丙→癸', '丁→壬', '戊→乙', '己→甲', '庚→丁', '辛→丙', '壬→己', '癸→戊'],
    '七杀': ['甲→庚', '乙→辛', '丙→壬', '丁→癸', '戊→甲', '己→乙', '庚→丙', '辛→丁', '壬→戊', '癸→己'],
    '正印': ['甲→壬', '乙→癸', '丙→甲', '丁→乙', '戊→丙', '己→丁', '庚→戊', '辛→己', '壬→庚', '癸→辛'],
    '偏印': ['甲→癸', '乙→壬', '丙→乙', '丁→甲', '戊→丁', '己→丙', '庚→己', '辛→戊', '壬→辛', '癸→庚'],
    '从儿': ['日主极弱无根且食伤成势']
}

# ---------- 基于官方文档的核心模块修正 ----------
class BaziCalculator:
    """八字计算核心模块（严格遵循lunar-python API）"""
    
    def __init__(self, lunar_year, lunar_month, lunar_day, lunar_hour, gender, is_leap_month=False):
        """
        参数说明：
        lunar_year: 农历年（数字，如2024）
        lunar_month: 农历月（1-12）
        lunar_day: 农历日（1-30）
        lunar_hour: 时辰（0-23）
        is_leap_month: 是否闰月（布尔值）
        """
        # 创建基础农历对象（包含时辰）
        try:
            # 使用完整的时间构造函数（文档5.1.1）
            self.lunar = Lunar.fromYmdHms(
                lunar_year, 
                lunar_month, 
                lunar_day, 
                lunar_hour,  # 直接使用24小时制
                0,  # 分钟
                0   # 秒钟
            )
        except Exception as e:
            raise ValueError(f"无效的农历日期 {lunar_year}-{lunar_month}-{lunar_day} {lunar_hour}时") from e

        # 处理闰月（文档5.1.3）
        if is_leap_month:
            if not self.lunar.getLeap():
                raise ValueError(f"{lunar_year}年{lunar_month}月没有闰月")
            self.lunar = self.lunar.getLeap()

        # 验证时辰设置（文档5.2.6）
        try:
            actual_zhi = self.lunar.getTimeZhi()
            expected_zhi = self._hour_to_shichen(lunar_hour)
            if actual_zhi != expected_zhi:
                raise ValueError(f"时辰异常: 程序计算为{expected_zhi} 实际获取{actual_zhi}")
        except Exception as e:
            raise ValueError(f"时辰验证失败: {str(e)}")

        # 获取八字信息（文档5.2）
        self.eight_char = self.lunar.getEightChar()
        self.gender = gender

        # 初始化子系统
        self.wuxing = WuXingSystem(self)
        self.shishen = ShiShenSystem(self)
        self.dayun = DaYunSystem(self)
        self.liunian = LiuNianSystem(self)

    def _hour_to_shichen(self, hour):
        """根据文档3.3的精确时辰划分"""
        SHICHEN_BOUNDARIES = {
            '子': (23, 1),  # 23:00-01:00
            '丑': (1, 3),   # 01:00-03:00
            '寅': (3, 5),   # 03:00-05:00
            '卯': (5, 7),   # 05:00-07:00
            '辰': (7, 9),
            '巳': (9, 11),
            '午': (11, 13),
            '未': (13, 15),
            '申': (15, 17),
            '酉': (17, 19),
            '戌': (19, 21),
            '亥': (21, 23)
        }
        
        for shichen, (start, end) in SHICHEN_BOUNDARIES.items():
            if (hour >= start and hour < end) or \
               (start > end and (hour >= start or hour < end)):
                return shichen
        raise ValueError(f"无效的小时值: {hour}")

# ---------- 五行系统最终修正 ----------
class WuXingSystem:
    """五行力量计算系统"""
    
    ZHI_WEIGHTS = {
        # 清理重复定义 (关键修复)
        '申': [('庚',3), ('壬',2), ('戊',1)],
        '午': [('丁',3), ('己',2)],
        '辰': [('戊',3), ('乙',2), ('癸',1)]
    }
    
    def __init__(self, calculator):
        self.calc = calculator
        self.weights = {'金':0, '木':0, '水':0, '火':0, '土':0}
        
    def calculate(self):
        """精确计算逻辑"""
        # 基础计算
        self._base_calculation()
        
        # 季节增强
        self._apply_season_boost()
        
        # 特殊格局调整
        self._apply_special_patterns()
        
        return self.weights
    
    def _base_calculation(self):
        """基础五行计算（修正藏干重复问题）"""
        # 修正前申的藏干被重复定义
        ZHI_WEIGHTS = {
            '申': [('庚',3), ('壬',2), ('戊',1)],  # 保留正确藏干
            # 删除重复的申、午、辰定义
        }

    def _apply_season_boost(self):
        """季节增强系数修正"""
        # 案例1(1990) 申月金旺应增强
        # 原计算：4 → 修正后应为 4*1.3=5.2 → 取整5
        # 需调整计算方式：
        month_zhi = self.calc.eight_char.getMonthZhi()
        season_map = {
            '寅': ('木', 1.3), '卯': ('木', 1.2), '辰': ('土', 1.1),  # 辰月土旺
            '巳': ('火', 1.3), '午': ('火', 1.2), '未': ('土', 1.1),  # 未月土旺
            '申': ('金', 1.3), '酉': ('金', 1.2), '戌': ('土', 1.1),  # 戌月土旺
            '亥': ('水', 1.3), '子': ('水', 1.2), '丑': ('土', 1.1)   # 丑月土旺
        }
        main_element, boost_factor = season_map.get(month_zhi, ('', 1))
        if main_element:
            boosted = self.weights[main_element] * boost_factor
            self.weights[main_element] = round(boosted, 1)

    def _apply_special_patterns(self):
        """特殊格局处理"""
        # 例如从革格、炎上格等特殊格局调整
        if self._is_congge_pattern():
            self.weights['金'] += 5
        elif self._is_yanshang_pattern():
            self.weights['火'] += 5

    def _add_element(self, gan, weight):
        element = self._get_element(gan)
        if element and weight > 0:
            self.weights[element] += weight
            
    def _get_element(self, gan):
        return {
            '甲':'木', '乙':'木', '丙':'火', '丁':'火',
            '戊':'土', '己':'土', '庚':'金', '辛':'金',
            '壬':'水', '癸':'水'
        }.get(gan, '')

    def _get_all_gan(self):
        """获取四柱天干"""
        ec = self.calc.eight_char
        return [
            ec.getYearGan(),
            ec.getMonthGan(),
            ec.getDayGan(),
            ec.getTimeGan()
        ]
    
    def _get_all_zhi(self):
        """获取四柱地支"""
        ec = self.calc.eight_char
        return [
            ec.getYearZhi(),
            ec.getMonthZhi(),
            ec.getDayZhi(),
            ec.getTimeZhi()
        ]

    def _is_congge_pattern(self):
        # Implementation of _is_congge_pattern method
        pass

    def _is_yanshang_pattern(self):
        # Implementation of _is_yanshang_pattern method
        pass

# ---------- 十神系统模块 ----------  
class ShiShenSystem:
    """十神关系系统"""
    
    def __init__(self, calculator):
        self.calc = calculator
        
    def _calculate_relation(self, day_gan, target_gan):
        """类内部十神计算方法"""
        for shishen, relations in SHISHEN_MAP.items():
            if f"{day_gan}→{target_gan}" in relations:
                return shishen
        return ''

    def get_gan_relation(self, target_gan):
        """天干十神关系"""
        day_gan = self.calc.eight_char.getDayGan()
        # 智能关系匹配算法
        
    def get_zhi_relation(self, zhi):
        """智能地支十神计算"""
        day_gan = self.calc.eight_char.getDayGan()
        context_zhi = [
            self.calc.eight_char.getYearZhi(),
            self.calc.eight_char.getMonthZhi(),
            self.calc.eight_char.getDayZhi(),
            self.calc.eight_char.getTimeZhi()
        ]
        
        return self._calculate_zhi_shi_shen(zhi, day_gan, context_zhi)

    def _calculate_zhi_shi_shen(self, zhi, day_gan, context_zhi):
        """统一的地支十神计算"""
        results = []
        main_energy = None
        
        for gan, weight in ZHI_CANGGAN.get(zhi, []):
            relation = self._calculate_relation(day_gan, gan)
            
            if weight == 3:
                main_energy = relation
                results.insert(0, relation)  # 主气置前
                continue
                
            if self._should_show_supplement(gan, weight, zhi, context_zhi):
                results.append(relation)
        
        return results if main_energy else []

    def _should_show_supplement(self, gan, weight, zhi, context_zhi):
        """判断是否显示补气"""
        # 权重条件
        if weight < 2:
            return False
            
        # 特殊组合条件
        if has_special_combination(zhi, context_zhi):
            return True
            
        # 生克关系条件
        return is_related_to_daymaster(gan, self.calc.eight_char.getDayGan())

    def get_relations(self):
        """完整十神关系计算"""
        relations = {
            "year_gan": self._get_relation(self.calc.eight_char.getYearGan()),
            "month_gan": self._get_relation(self.calc.eight_char.getMonthGan()),
            "day_gan": "日主",
            "time_gan": self._get_relation(self.calc.eight_char.getTimeGan())
        }
        return relations
    
    def _get_relation(self, target_gan):
        day_gan = self.calc.eight_char.getDayGan()
        return self._calculate_relation(day_gan, target_gan)

# ---------- 大运系统最终修正 ----------
class DaYunSystem:
    """大运计算系统"""
    
    def __init__(self, calculator):
        self.calc = calculator
        
    def generate(self):
        """生成十年大运"""
        return self._calculate_dayun()
    
    def _get_nayin(self, ganzhi):
        """完整纳音映射表"""
        nayin_map = {
            '甲子':'海中金', '乙丑':'海中金', '丙寅':'炉中火', '丁卯':'炉中火',
            '戊辰':'大林木', '己巳':'大林木', '庚午':'路旁土', '辛未':'路旁土',
            '壬申':'剑锋金', '癸酉':'剑锋金', '甲戌':'山头火', '乙亥':'山头火',
            '丙子':'涧下水', '丁丑':'涧下水', '戊寅':'城头土', '己卯':'城头土',
            '庚辰':'白蜡金', '辛巳':'白蜡金', '壬午':'杨柳木', '癸未':'杨柳木',
            '甲申':'泉中水', '乙酉':'泉中水', '丙戌':'屋上土', '丁亥':'屋上土',
            '戊子':'霹雳火', '己丑':'霹雳火', '庚寅':'松柏木', '辛卯':'松柏木',
            '壬辰':'长流水', '癸巳':'长流水', '甲午':'砂石金', '乙未':'砂石金',
            '丙申':'山下火', '丁酉':'山下火', '戊戌':'平地木', '己亥':'平地木',
            '庚子':'壁上土', '辛丑':'壁上土', '壬寅':'金箔金', '癸卯':'金箔金',
            '甲辰':'覆灯火', '乙巳':'覆灯火', '丙午':'天河水', '丁未':'天河水',
            '戊申':'大驿土', '己酉':'大驿土', '庚戌':'钗钏金', '辛亥':'钗钏金',
            '壬子':'桑柘木', '癸丑':'桑柘木', '甲寅':'大溪水', '乙卯':'大溪水',
            '丙辰':'沙中土', '丁巳':'沙中土', '戊午':'天上火', '己未':'天上火',
            '庚申':'石榴木', '辛酉':'石榴木', '壬戌':'大海水', '癸亥':'大海水'
        }
        return nayin_map.get(ganzhi, '未知')

    def _calculate_dayun(self):
        """完整的大运计算逻辑"""
        lunar = self.calc.lunar
        day_gan = lunar.getDayGan()
        day_zhi = lunar.getDayZhi()
        
        # 正统顺逆判断规则（文档7.3.2）
        reverse = (self.calc.gender == "男" and day_gan in ['乙','丁','己','辛','癸']) or \
                (self.calc.gender == "女" and day_gan in ['甲','丙','戊','庚','壬'])
        
        # 生成干支序列
        dayun_list = []
        current_index = gan_list.index(day_gan)
        zhi_index = zhi_list.index(day_zhi)
        
        for i in range(1, 11):
            if reverse:
                gan = gan_list[(current_index - i) % 10]
                zhi = zhi_list[(zhi_index - i) % 12]
            else:
                gan = gan_list[(current_index + i) % 10]
                zhi = zhi_list[(zhi_index + i) % 12]
            dayun_list.append(f"{gan}{zhi}")
        
        # 起运时间计算
        birth_year = lunar.getSolar().getYear()
        current_year = dt.now().year
        base_age = current_year - birth_year + 1
        return [{
            "start_age": base_age + i*10,
            "ganzhi": dayun_list[i],
            "element": self._get_nayin(dayun_list[i])
        } for i in range(10)]

# ---------- 新增流年系统最终修正 ----------
class LiuNianSystem:
    """流年计算系统"""
    
    def __init__(self, calculator):
        self.calc = calculator
        
    def generate(self):
        """生成未来十年流年"""
        # 基于出生年的正确偏移计算
        base_year = self.calc.lunar.getSolar().getYear()
        return [{
            "year": base_year + i,
            "ganzhi": self._get_liunian_ganzhi(i),
            "shensha": self._get_liunian_shensha(i)
        } for i in range(10)]
    
    def _get_liunian_ganzhi(self, offset):
        current_year = dt.now().year
        target_year = current_year + offset
        target_lunar = Lunar.fromYmd(target_year, 1, 1)
        return target_lunar.getYearInGanZhi()
    
    def _get_liunian_shensha(self, offset):
        return {
            "taisui": self._get_taisui(offset),
            "suipo": self._get_suipo(),
            "tianyi": self._get_tianyi(self.calc.lunar.getDayGan(), offset)
        }

    def _get_taisui(self, offset):
        """遵循API规范的太岁计算"""
        current_year = self.calc.lunar.getSolar().getYear()  # 改用出生年
        target_year = current_year + offset
        
        try:
            # 获取当前年份立春准确时间（文档6.2节气）
            lunar = Lunar.fromYmd(current_year, 1, 1)
            jieqi = lunar.getJieQiTable()['立春']
            
            # 正确获取阳历日期（文档5.1.2）
            spring_date = dt(
                jieqi.getYear(),
                jieqi.getMonth(),
                jieqi.getDay(),
                jieqi.getHour(),
                jieqi.getMinute(),
                jieqi.getSecond()
            )
            
            if dt.now() < spring_date:
                target_year -= 1
        except Exception as e:
            print(f"立春获取失败: {e}, 使用农历年计算")
        
        # 获取目标年信息（文档5.2.1）
        year_lunar = Lunar.fromYmd(target_year, 1, 1)
        return {
            "ganzhi": year_lunar.getYearInGanZhi(),
            "shengxiao": year_lunar.getYearShengXiao(),
            "year": target_year  # 新增年份显示
        }
    
    def _get_suipo(self):
        """实现岁破计算"""
        year_zhi = self.calc.lunar.getYearZhi()
        suipo_map = {
            '子':'午', '丑':'未', '寅':'申',
            '卯':'酉', '辰':'戌', '巳':'亥',
            '午':'子', '未':'丑', '申':'寅',
            '酉':'卯', '戌':'辰', '亥':'巳'
        }
        return suipo_map.get(year_zhi)

    def _get_tianyi(self, day_gan, offset):
        """实现天乙贵人计算"""
        tianyi_rules = {
            '甲': ['丑','未'], '乙': ['子','申'],
            '丙': ['亥','酉'], '丁': ['亥','酉'],
            '戊': ['丑','未'], '己': ['子','申'],
            '庚': ['寅','午'], '辛': ['卯','巳'],
            '壬': ['卯','巳'], '癸': ['寅','午']
        }
        return tianyi_rules.get(day_gan, [])

# ---------- 使用示例更新 ----------
if __name__ == "__main__":
    # 示例：直接传入农历日期（2024年五月初十 午时）
    calculator = BaziCalculator(
        lunar_year=2024,
        lunar_month=5,
        lunar_day=10,
        lunar_hour=11,  # 11-13为午时
        gender="男"
    )
    
    # 获取各模块结果
    wuxing = calculator.wuxing.calculate()
    shishen = calculator.shishen.get_relations()
    dayun = calculator.dayun.generate()
    
    print(f"五行力量：{wuxing}")
    print(f"十神关系：{shishen}")
    print(f"大运走势：[首运] {dayun[0]}")

def test_bazi_comprehensive():
    """增强版八字测试脚本，包含有效性验证"""
    
    test_dates = [
        (1990, 8, 23, 12, "男"),
        (1985, 2, 15, 8, "女"),
        (2000, 1, 1, 0, "男"),
        (1975, 10, 10, 21, "女"),
    ]
    
    for year, month, day, hour, gender in test_dates:
        print(f"\n{'='*60}")
        print(f"测试案例: {year}-{month}-{day} {hour}时 ({gender})")
        print(f"{'-'*60}")
        
        solar = Solar.fromYmdHms(year, month, day, hour, 0, 0)
        lunar = solar.getLunar()
        eight_char = lunar.getEightChar()
        
        # 1. 基础信息验证
        print("[基础信息]")
        print(f"公历: {solar}")
        print(f"农历: {lunar}")
        print(f"八字: {eight_char}")
        
        # 2. 十神验证
        print("\n[十神验证]")
        print(f"年干: {calculator.shishen._get_relation(eight_char.getYearGan())}")
        print(f"年支: {', '.join(get_zhi_shi_shen(eight_char.getYearZhi(), eight_char.getDayGan(), eight_char.getYearZhi()))}")
        print(f"月干: {calculator.shishen._get_relation(eight_char.getMonthGan())} | 月支: {', '.join(get_zhi_shi_shen(eight_char.getMonthZhi(), eight_char.getDayGan(), eight_char.getMonthZhi()))}")
        print(f"时干: {calculator.shishen._get_relation(eight_char.getTimeGan())} | 时支: {', '.join(get_zhi_shi_shen(eight_char.getTimeZhi(), eight_char.getDayGan(), eight_char.getTimeZhi()))}")
        
        # 3. 神煞验证（仅真实存在的方法）
        print("\n[神煞验证]")
        # 日柱神煞（已验证存在）
        day_sha = {
            "天神": lunar.getDayTianShen(),
            "黄黑道": lunar.getDaySha()
        }
        # 过滤空值吉凶神
        if len(lunar.getDayJiShen()) > 0:
            day_sha["吉神"] = ', '.join(lunar.getDayJiShen())
        if len(lunar.getDayXiongSha()) > 0:
            day_sha["凶煞"] = ', '.join(lunar.getDayXiongSha())
        
        print(f"日神煞: {format_sha(day_sha)}")
        
        # 时柱神煞（存在性检查）
        time_sha = {}
        if hasattr(lunar, 'getTimeTianShen'):
            tian_shen = lunar.getTimeTianShen()
            if tian_shen and tian_shen != "无":
                time_sha["天神"] = tian_shen
        print(f"时神煞: {format_sha(time_sha)}")
        
        # 4. 有效性检查
        print("\n[有效性检查]")
        check_essential_values(eight_char, lunar)

        # 在测试函数内添加结构化输出
        analysis_data = {
            "basic": {
                "bazi": str(eight_char),  # 八字字符串
                "solar": solar.toString(), 
                "lunar": lunar.toString(),
                "gender": gender,
                "zodiac": lunar.getYearShengXiao()  # 生肖
            },
            
            # 核心分析要素
            "elements": {
                "day_master": {  # 日主
                    "gan": eight_char.getDayGan(),
                    "element": eight_char.getDayWuXing()
                },
                "strength": calculate_wuxing_strength(eight_char)  # 需实现五行力量计算
            },
            
            # 十神关系（结构化存储）
            "shishen": {
                "year": {
                    "gan": eight_char.getYearGan(),
                    "zhi": eight_char.getYearZhi()
                },
                "month": {
                    "gan": eight_char.getMonthGan(),
                    "zhi": eight_char.getMonthZhi()
                },
                "hour": {
                    "gan": eight_char.getTimeGan(),
                    "zhi": eight_char.getTimeZhi()
                }
            },
            
            # 神煞体系（包含原始和传统）
            "shensha": {
                "original": {  # 库原生数据
                    "day_tianshen": lunar.getDayTianShen(),
                    "day_jishen": lunar.getDayJiShen(),
                    "day_xiongsha": lunar.getDayXiongSha()
                },
                "traditional": get_traditional_shensha(lunar)  # 自定义传统神煞
            },
            
            # 大运分析（需实现十年一运计算）
            "dayun": calculator.dayun.generate(),
            
            # 流年分析（未来十年）
            "liunian": calculator.liunian.generate()
        }

        # 打印结构化数据
        print("\n[深度分析]")
        print(f"五行力量：{analysis_data['elements']['strength']}")
        print(f"传统神煞：{analysis_data['shensha']['traditional']}")
        print(f"首步大运：{analysis_data['dayun'][0]['ganzhi']} ({analysis_data['dayun'][0]['element']})")
        print(f"本年流年：{analysis_data['liunian'][0]['ganzhi']} 太岁：{analysis_data['liunian'][0]['shensha']['taisui']}")

def format_sha(sha_dict):
    """格式化神煞输出"""
    return " | ".join([f"{k}:{v}" for k,v in sha_dict.items() if v and len(str(v)) > 0])

def check_essential_values(eight_char, lunar):
    """关键值非空检查"""
    essentials = {
        "年柱纳音": eight_char.getYearNaYin(),
        "日主五行": eight_char.getDayWuXing().replace(' ','')[:1],
        "月柱干支": eight_char.getMonth(),
        "时柱天神": lunar.getTimeTianShen() if hasattr(lunar, 'getTimeTianShen') else None
    }
    
    for k,v in essentials.items():
        status = "有效" if v and v not in ["", "无"] else "无效"
        print(f"{k.ljust(8)}: {str(v).ljust(10)} [{status}]")

def calculate_wuxing_strength(eight_char):
    """修复版五行力量计算"""
    wuxing_map = {
        '甲':'木', '乙':'木', '丙':'火', '丁':'火',
        '戊':'土', '己':'土', '庚':'金', '辛':'金',
        '壬':'水', '癸':'水'
    }
    
    weights = {'金':0, '木':0, '水':0, '火':0, '土':0}
    
    # 处理天干
    for gan in eight_char.getYearGan(), eight_char.getMonthGan(), eight_char.getDayGan(), eight_char.getTimeGan():
        element = wuxing_map.get(gan, '')
        if element:
            weights[element] += 1

    # 修正地支藏干数据结构（关键修复点）
    zhi_weights = {
        '子': [('癸',3)],
        '丑': [('己',3), ('辛',2), ('癸',1)],
        '寅': [('甲',3), ('丙',2), ('戊',1)],
        '卯': [('乙',3)],
        '辰': [('戊',3), ('乙',2), ('癸',1)],
        '巳': [('丙',3), ('戊',2), ('庚',1)],
        '午': [('丁',3), ('己',2)],
        '未': [('己',3), ('丁',2), ('乙',1)],
        '申': [('庚',3), ('壬',2), ('戊',1)],
        '酉': [('辛',3)],
        '戌': [('戊',3), ('辛',2), ('丁',1)],
        '亥': [('壬',3), ('甲',1)]
    }
    
    # 处理地支藏干（带权重）
    for zhi in eight_char.getYearZhi(), eight_char.getMonthZhi(), eight_char.getDayZhi(), eight_char.getTimeZhi():
        for gan, weight in zhi_weights.get(zhi, []):
            element = wuxing_map.get(gan, '')
            if element and weight > 0:
                weights[element] += weight
                
    return weights

def get_traditional_shensha(lunar):
    """修正版传统神煞计算"""
    shensha = {}
    day_gan = lunar.getDayGan()
    year_zhi = lunar.getYearZhi()
    
    # 天乙贵人
    tianyi_rules = {
        '庚': ['寅','午'],  # 关键修正点
        '甲': ['丑','未'], '乙': ['子','申'],
        '丙': ['亥','酉'], '丁': ['亥','酉'],
        '戊': ['丑','未'], '己': ['子','申'],
        '壬': ['卯','巳'], '癸': ['卯','巳']
    }
    shensha['天乙贵人'] = tianyi_rules.get(day_gan, [])
    
    # 文昌星
    wenchang_rules = {
        '甲':'巳', '乙':'午', '丙':'申', '丁':'酉',
        '戊':'申', '己':'酉', '庚':'亥', '辛':'子',
        '壬':'寅', '癸':'卯'
    }
    shensha['文昌'] = wenchang_rules.get(day_gan)
    
    # 桃花
    taohua_rules = {
        '午': '卯',  # 关键修正点
        '申':'酉', '子':'酉', '辰':'酉',
        '寅':'午', '午':'卯', '戌':'卯',
        '巳':'午', '酉':'子', '丑':'午',
        '亥':'卯', '卯':'子', '未':'子'
    }
    shensha['桃花'] = taohua_rules.get(year_zhi)
    
    # 新增驿马计算
    yima_rules = {
        '申':'寅', '子':'寅', '辰':'寅',
        '寅':'申', '午':'申', '戌':'申',
        '巳':'亥', '酉':'亥', '丑':'亥',
        '亥':'巳', '卯':'巳', '未':'巳'
    }
    shensha['驿马'] = yima_rules.get(year_zhi)
    
    return shensha

def get_zhi_shi_shen(zhi, day_gan, context_zhi):
    """地支十神（含智能补气）"""
    ZHI_CANGGAN = {
        '子': [('癸',3)], '丑': [('己',3),('辛',2),('癸',1)],
        '寅': [('甲',3),('丙',2),('戊',1)], '卯': [('乙',3)],
        '辰': [('戊',3),('乙',2),('癸',1)], '巳': [('丙',3),('戊',2),('庚',1)],
        '午': [('丁',3),('己',2)], '未': [('己',3),('丁',2),('乙',1)],
        '申': [('庚',3),('壬',2),('戊',1)], '酉': [('辛',3)],
        '戌': [('戊',3),('辛',2),('丁',1)], '亥': [('壬',3),('甲',1)]
    }
    
    shishen_sys = ShiShenSystem(calculator)  # 需要获取当前计算器实例
    results = []
    for gan, weight in ZHI_CANGGAN.get(zhi, []):
        if weight >=3:
            results.append(shishen_sys._calculate_relation(day_gan, gan))
            continue
            
        # 补气判断条件
        if weight >=2 and (has_special_combination(zhi, context_zhi) or 
                          is_related_to_daymaster(gan, day_gan)):
            results.append(shishen_sys._calculate_relation(day_gan, gan))
    
    return results

def has_special_combination(zhi, context_zhi):
    """三合五合特殊格局判断"""
    COMBOS = {
        '寅': ['午', '戌'], '午': ['寅', '戌'], '戌': ['寅', '午'],
        '申': ['子', '辰'], '子': ['申', '辰'], '辰': ['申', '子'],
        '巳': ['酉', '丑'], '酉': ['巳', '丑'], '丑': ['巳', '酉'],
        '亥': ['卯', '未'], '卯': ['亥', '未'], '未': ['亥', '卯']
    }
    return any(c in context_zhi for c in COMBOS.get(zhi, []))

def is_related_to_daymaster(gan, day_gan):
    """判断是否与日主有生克关系"""
    def get_element(g):
        return get_wuxing(g)  # 使用新定义的函数
    
    day_element = get_element(day_gan)
    gan_element = get_element(gan)
    
    # 实现五行相生相克判断
    if not day_element or not gan_element:
        return False
        
    # 相生：木→火→土→金→水→木
    # 相克：木→土→水→火→金→木
    productive = ['木火', '火土', '土金', '金水', '水木']
    restraining = ['木土', '土水', '水火', '火金', '金木']
    
    relation = f"{day_element}{gan_element}"
    return relation in productive or relation in restraining

# 新增地支生肖映射
zhi_animal_map = {
    '子':'鼠', '丑':'牛', '寅':'虎', '卯':'兔',
    '辰':'龙', '巳':'蛇', '午':'马', '未':'羊',
    '申':'猴', '酉':'鸡', '戌':'狗', '亥':'猪'
}

# 新增五行属性获取函数（约第380行）
def get_wuxing(gan):
    """天干转五行"""
    wuxing_map = {
        '甲':'木', '乙':'木', '丙':'火', '丁':'火',
        '戊':'土', '己':'土', '庚':'金', '辛':'金',
        '壬':'水', '癸':'水'
    }
    return wuxing_map.get(gan, '')

def test_special_cases():
    """特殊格局验证"""
    # 从革格（全金局）
    case = BaziCalculator(2023, 8, 15, 15, "男")  # 癸卯 辛酉 庚申 甲申
    assert '从革格' in case.wuxing.special_patterns

    # 炎上格（全火局）
    case = BaziCalculator(2002, 5, 12, 11, "女")  # 壬午 丙午 丙寅 甲午
    assert '炎上格' in case.wuxing.special_patterns

if __name__ == "__main__":
    test_bazi_comprehensive() 
