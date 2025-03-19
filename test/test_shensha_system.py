import unittest
from lunar_python import Lunar
from src.shensha import get_traditional_shensha, get_lunar_shensha

class ShenShaSystemTest(unittest.TestCase):
    def test_case_201(self):
        lunar = Lunar.fromYmdHms(2023,2,4,10,0,0)
        traditional = get_traditional_shensha(lunar)
        lunar_shensha = get_lunar_shensha(lunar)
        
        self.assertTrue(traditional['文昌'])
        self.assertIn('天德', lunar_shensha['日神煞']['吉神'])

    def test_case_202(self):
        lunar = Lunar.fromYmdHms(2020,12,7,15,0,0)
        traditional = get_traditional_shensha(lunar)
        self.assertTrue(traditional['天德贵人'])
        self.assertEqual(lunar.getYearTaiSui(), '庚子')

    def test_case_203(self):
        lunar = Lunar.fromYmdHms(1998,5,5,8,0,0)
        traditional = get_traditional_shensha(lunar)
        self.assertTrue(traditional['月德贵人'])
        self.assertIn('劫煞', lunar.getDayXiongSha())

    def test_case_204(self):
        lunar = Lunar.fromYmdHms(1985,8,23,22,0,0)
        traditional = get_traditional_shensha(lunar)
        self.assertTrue(traditional['将星'])
        self.assertEqual(lunar.getMonthDeHe(), '丁')

    def test_case_205(self):
        lunar = Lunar.fromYmdHms(2002,6,21,12,0,0)
        traditional = get_traditional_shensha(lunar)
        self.assertTrue(traditional['福星贵人'])
        self.assertEqual(lunar.getYearSuaiPo(), '午')

    def test_case_206(self):
        lunar = Lunar.fromYmdHms(1977,3,20,18,0,0)
        traditional = get_traditional_shensha(lunar)
        self.assertTrue(traditional['金舆禄'])
        self.assertIsNotNone(lunar.getDayTianYuan())

    def test_case_207(self):
        lunar = Lunar.fromYmdHms(2015,11,12,3,0,0)
        traditional = get_traditional_shensha(lunar)
        self.assertTrue(traditional['魁罡贵人'])
        self.assertIn('月德', lunar.getDayJiShen())

    def test_case_208(self):
        lunar = Lunar.fromYmdHms(2024,1,6,9,0,0)
        traditional = get_traditional_shensha(lunar)
        self.assertEqual(traditional['天医'], '丑')
        self.assertEqual(lunar.getMonthDeHe(), '辛')

    def test_case_209(self):
        lunar = Lunar.fromYmdHms(1993,9,7,23,0,0)
        traditional = get_traditional_shensha(lunar)
        self.assertFalse(traditional['文昌'])
        self.assertEqual(lunar.getYearTaiSui(), '癸酉')

    def test_case_210(self):
        lunar = Lunar.fromYmdHms(1989,4,20,7,0,0)
        lunar_shensha = get_lunar_shensha(lunar)
        self.assertIn('三奇', lunar_shensha['日神煞']['吉神']) 