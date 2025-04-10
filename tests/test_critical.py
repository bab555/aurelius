import unittest
from lunar_python import Lunar
from modules.calculator import (
    lunar_converter,
    jieqi_calculator,
    age_calculator
)

class TestCriticalCases(unittest.TestCase):
    def test_1969_case(self):
        # 农历转公历
        solar = lunar_converter.convert_lunar_to_solar(1969, 12, 6)
        self.assertEqual(str(solar), "1970-01-13 00:00:00")
        
        # 获取年干
        lunar = Lunar.fromSolar(solar)
        year_gan = lunar.getYearGan()
        self.assertEqual(year_gan, "己")  # 新增断言
        
        # 节气判断
        jieqi = jieqi_calculator.get_nearest_jieqi(solar, "男", year_gan)
        self.assertEqual(jieqi.getName(), "小寒")
        
        # 起运计算
        age = age_calculator.calculate_starting_age(solar, jieqi.getSolar())
        self.assertAlmostEqual(age, 2.5, delta=0.1) 