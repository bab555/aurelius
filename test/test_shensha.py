import unittest
from lunar_python import Lunar
from src.shensha import get_traditional_shensha, get_lunar_shensha

class ShenShaTest(unittest.TestCase):
    def test_tiande(self):
        # 案例：甲日生于寅月（天德贵人在丁）
        lunar = Lunar.fromYmd(2023, 1, 1)  # 寅月
        lunar.setDayGan('甲')
        shensha = get_traditional_shensha(lunar)
        self.assertTrue(shensha['天德贵人'])
        
    def test_jiangxing(self):
        # 年支申，将星在子
        lunar = Lunar.fromYmd(2020, 1, 1)  # 申年
        lunar.setDayZhi('子')
        shensha = get_traditional_shensha(lunar)
        self.assertEqual(shensha['将星'], True)

    def test_fuxing(self):
        # 甲寅日应带福星
        lunar = Lunar.fromYmd(2023, 5, 1).getDayGanZhi() # 手动设为甲寅日
        shensha = get_traditional_shensha(lunar)
        self.assertTrue(shensha['福星贵人'])
        
    def test_jinyu(self):
        # 年支子+日干甲
        lunar = Lunar.fromYmd(2020, 1, 1)  # 子年
        lunar.setDayGan('甲')
        self.assertTrue(shensha['金舆禄'])
        
    def test_kuigang(self):
        # 庚辰日
        lunar = Lunar.fromYmd(2023, 3, 5).getDayGanZhi() # 设为庚辰日
        self.assertTrue(shensha['魁罡贵人']) 

    def test_wenchang(self):
        # 甲日巳时应带文昌
        lunar = Lunar.fromYmdHms(2023,5,10,10,0,0)  # 甲日巳时
        lunar.setDayGan('甲')
        lunar.setTimeZhi('巳')
        self.assertTrue(get_traditional_shensha(lunar)['文昌'])

    def test_tianyi_judge(self):
        # 日主火，天医水（凶）
        lunar = Lunar.fromYmd(2023,5,1)
        lunar.setDayGan('丙')  # 火
        shensha = get_traditional_shensha(lunar)
        self.assertEqual(shensha['天医_吉凶'], '平')  # 水克火 

    def test_lunar_shensha(self):
        # 验证luanr库神煞输出
        lunar = Lunar.fromYmdHms(2023,5,10,10,0,0)
        shensha = get_lunar_shensha(lunar)
        self.assertIsInstance(shensha['日神煞']['吉神'], list)
        self.assertIsNotNone(shensha['年神煞']['太岁'])

    def test_wenchang_edge(self):
        # 测试戊日申时文昌
        lunar = Lunar.fromYmdHms(2023,5,10,15,0,0)  # 申时
        lunar.setDayGan('戊')
        self.assertTrue(get_traditional_shensha(lunar)['文昌']) 