from datetime import date

from sqlalchemy.orm import Session

from . import database as models


def init_seed_data(db: Session):
    existing_farm = db.query(models.ForestFarm).first()
    if existing_farm:
        return

    farms = [
        models.ForestFarm(
            name="青云山国营林场",
            location="华东地区青云山脉",
            region="华东-南岭山地森林生态区",
            established_year=1958,
            description="老一辈务林人于大炼钢铁后荒山造林起家，经三代人接续奋斗，现经营面积五万余亩。",
        ),
        models.ForestFarm(
            name="绿水江省级林场",
            location="长江中游绿水江流域",
            region="华中-长江中游防护林体系",
            established_year=1972,
            description="建场时以防风固土、涵养水源为主要目标，现为省级森林生态系统定位研究站。",
        ),
        models.ForestFarm(
            name="翠竹峡实验林场",
            location="闽西北翠竹峡山区",
            region="东南-武夷山山地森林区",
            established_year=1985,
            description="隶属于省林业科学研究院，承担杉木、马尾松良种选育与丰产栽培试验。",
        ),
    ]
    db.add_all(farms)
    db.flush()

    qy_farm_id = farms[0].id
    ls_farm_id = farms[1].id
    cz_farm_id = farms[2].id

    plots = [
        models.Plot(
            farm_id=qy_farm_id,
            plot_code="QY-A-001",
            plot_name="青云山北坡杉木初代林",
            tree_species="杉木",
            planting_year=1962,
            area_hectare=12.5,
            elevation=680.0,
            soil_type="山地黄壤",
            initial_density=2500,
            notes="陈守林先生带队于三年困难时期开荒造林，全人工整地植苗。为全场最早成林的一片。",
        ),
        models.Plot(
            farm_id=qy_farm_id,
            plot_code="QY-B-017",
            plot_name="马尾松二代改良试验地",
            tree_species="马尾松",
            planting_year=1978,
            area_hectare=8.2,
            elevation=520.0,
            soil_type="红壤",
            initial_density=3000,
            notes="李耕耘先生负责建系，引入第一代优树自由授粉子代测定林。",
        ),
        models.Plot(
            farm_id=qy_farm_id,
            plot_code="QY-D-203",
            plot_name="杉木三代种子园示范林",
            tree_species="杉木",
            planting_year=1995,
            area_hectare=15.6,
            elevation=450.0,
            soil_type="红黄壤",
            initial_density=2200,
            notes="王青山先生主持营建，采用1.5代种子园种子造林，是当时林业部重点示范片。",
        ),
        models.Plot(
            farm_id=qy_farm_id,
            plot_code="QY-E-345",
            plot_name="针阔混交近自然经营林",
            tree_species="针阔混交",
            planting_year=2012,
            area_hectare=21.3,
            elevation=380.0,
            soil_type="山地红壤",
            initial_density=1800,
            notes="陈晓苗女士牵头设计，杉木×木荷×枫香行带状混交，目标是培育大径材和多功能林分。",
        ),
        models.Plot(
            farm_id=ls_farm_id,
            plot_code="LS-C-009",
            plot_name="绿水江西岸湿地松防护林",
            tree_species="湿地松",
            planting_year=1975,
            area_hectare=32.8,
            elevation=120.0,
            soil_type="潮土",
            initial_density=2000,
            notes="绿水江洪水后紧急造林固岸，张绿原女士任造林技术负责人，连续三月住在江边工棚。",
        ),
        models.Plot(
            farm_id=ls_farm_id,
            plot_code="LS-F-128",
            plot_name="栎类天然次生改培林",
            tree_species="栎类",
            planting_year=2003,
            area_hectare=18.5,
            elevation=260.0,
            soil_type="黄棕壤",
            initial_density=1500,
            notes="刘森林主持次生林定向改培，保留乡土栎类，补植木荷、枫香，调整混交比例。",
        ),
        models.Plot(
            farm_id=ls_farm_id,
            plot_code="LS-G-256",
            plot_name="杨树短周期工业原料林",
            tree_species="杨树",
            planting_year=2018,
            area_hectare=25.0,
            elevation=95.0,
            soil_type="冲积土",
            initial_density=1100,
            notes="赵新生引进南林95、南林895等杨树新品种，采用大苗深栽技术示范。",
        ),
        models.Plot(
            farm_id=cz_farm_id,
            plot_code="CZ-SH-033",
            plot_name="杉木高世代种源试验林",
            tree_species="杉木",
            planting_year=1990,
            area_hectare=6.8,
            elevation=720.0,
            soil_type="山地黄壤",
            initial_density=2600,
            notes="包含12个省46个种源，是南方杉木种源区试验的重要野外基地。",
        ),
        models.Plot(
            farm_id=cz_farm_id,
            plot_code="CZ-HN-078",
            plot_name="阔叶树高效培育示范林",
            tree_species="阔叶混交",
            planting_year=2008,
            area_hectare=14.2,
            elevation=580.0,
            soil_type="红黄壤",
            initial_density=1700,
            notes="樟树、檫木、木荷、枫香块状混交，林梦绿负责立地分类与密度控制。",
        ),
        models.Plot(
            farm_id=cz_farm_id,
            plot_code="CZ-AS-112",
            plot_name="相思树短轮伐期纸浆林",
            tree_species="相思树",
            planting_year=2021,
            area_hectare=11.5,
            elevation=230.0,
            soil_type="赤红壤",
            initial_density=1667,
            notes="引种厚荚相思与卷荚相思，开展无性系对比与施肥试验，最新一代科研成果。",
        ),
    ]
    db.add_all(plots)
    db.flush()

    plot_codes = {p.plot_code: p.id for p in plots}

    def growth_seq(plot_code, start_year, end_year, base_vol, annual_delta, maturity_vol=None):
        records = []
        pid = plot_codes[plot_code]
        vol = base_vol
        for year in range(start_year, end_year + 1, 2):
            if year == start_year:
                vol = base_vol
            else:
                vol += annual_delta * 2
            if maturity_vol and vol > maturity_vol:
                vol = maturity_vol
            age = year - start_year
            h = round(2.0 + age * 0.45 + (0 if age < 5 else (age - 5) * 0.1), 1)
            dbh = round(1.5 + age * 0.55, 1)
            records.append(
                models.GrowthRecord(
                    plot_id=pid,
                    record_year=year,
                    mean_height_m=h,
                    mean_dbh_cm=dbh,
                    volume_per_ha_m3=round(vol, 2),
                    mortality_rate=round(0.03 - min(age, 40) * 0.0005, 4),
                    survey_date=date(year, 10, 20),
                    survey_method="每木检尺(10%样地)",
                    surveyors="场部技术股",
                )
            )
        return records

    all_growth = []

    all_growth += growth_seq("QY-A-001", 1965, 2025, 15.0, 3.2, 360.0)
    all_growth += growth_seq("QY-B-017", 1980, 2025, 12.0, 3.5, 320.0)
    all_growth += growth_seq("QY-D-203", 1997, 2025, 18.0, 4.8, 280.0)
    all_growth += growth_seq("QY-E-345", 2014, 2025, 22.0, 6.5)
    all_growth += growth_seq("LS-C-009", 1978, 2025, 20.0, 3.8, 290.0)
    all_growth += growth_seq("LS-F-128", 2005, 2025, 16.0, 4.2)
    all_growth += growth_seq("LS-G-256", 2020, 2025, 25.0, 8.5)
    all_growth += growth_seq("CZ-SH-033", 1992, 2025, 20.0, 4.5, 270.0)
    all_growth += growth_seq("CZ-HN-078", 2010, 2025, 19.0, 5.5)
    all_growth += growth_seq("CZ-AS-112", 2023, 2025, 18.0, 9.0)

    db.add_all(all_growth)
    db.flush()

    researchers = [
        models.Researcher(
            name="陈守林",
            gender="男",
            birth_year=1928,
            title="高级工程师（已故）",
            institution="青云山林场",
            specialty="杉木造林与森林经理",
            join_year=1952,
            bio=(
                "新中国第一代务林人，参加过东北林区开发，后主动请缨到南方荒山。"
                "1958年率27名青年进驻青云山，吃住岩洞，手挖肩挑，用十年时间让万亩"
                "荒山披上绿装。常说：青山不老，我亦不老。"
            ),
            avatar_color="#3d5a3d",
        ),
        models.Researcher(
            name="李耕耘",
            gender="男",
            birth_year=1936,
            title="教授级高级工程师",
            institution="青云山林场",
            specialty="马尾松遗传育种",
            join_year=1960,
            bio="林学系本科毕业后分配至青云山，建立南方第一个马尾松优树收集区，保存了230株优树资源。退休后仍每年上山观察，直至85岁高龄。",
            avatar_color="#4a6741",
        ),
        models.Researcher(
            name="张绿原",
            gender="女",
            birth_year=1945,
            title="高级工程师",
            institution="绿水江林场",
            specialty="防护林营造与流域治理",
            join_year=1968,
            bio='1975年绿水江洪水后，主动请缨负责西岸防护林带造林，带领500名群众奋战100天，完成3000多亩湿地松造林。被誉为"绿水江边的女愚公"。',
            avatar_color="#556b2f",
        ),
        models.Researcher(
            name="王青山",
            gender="男",
            birth_year=1956,
            title="教授级高级工程师/博士生导师",
            institution="青云山林场、省林科院",
            specialty="杉木种子园营建与高世代育种",
            join_year=1978,
            bio="恢复高考后第一届林学专业，师从李耕耘先生，主持完成杉木三代种子园攻关，使遗传增益提高15%以上。指导硕博士30余人，论文被引超千次。",
            avatar_color="#6b8e23",
        ),
        models.Researcher(
            name="刘森林",
            gender="男",
            birth_year=1968,
            title="教授级高级工程师",
            institution="绿水江林场",
            specialty="次生林改培与多功能经营",
            join_year=1991,
            bio='师承张绿原女士，将传统防护林理论与近自然经营结合，提出"保土保水保生物多样性"三保经营法，在长江中游推广50万亩。',
            avatar_color="#698b69",
        ),
        models.Researcher(
            name="陈晓苗",
            gender="女",
            birth_year=1978,
            title="研究员",
            institution="省林业科学研究院",
            specialty="针阔混交林结构调控与碳汇功能",
            join_year=2003,
            bio='陈守林先生孙女，北京林业大学博士毕业，留学美国后毅然回山。主持国家自然科学基金项目，提出"结构-功能-生境"三位一体森林经营理论。',
            avatar_color="#80a86a",
        ),
        models.Researcher(
            name="林梦绿",
            gender="女",
            birth_year=1985,
            title="副研究员",
            institution="翠竹峡实验林场、省林科院",
            specialty="阔叶树种选育与立地生态分类",
            join_year=2010,
            bio='师从王青山教授，负责阔叶树良种选育，筛选出5个速生优质樟树家系、3个檫木无性系。首创"精确立地+目标材种"定向培育模式。',
            avatar_color="#90a955",
        ),
        models.Researcher(
            name="赵新生",
            gender="男",
            birth_year=1992,
            title="助理研究员/在读博士",
            institution="绿水江林场",
            specialty="杨树工业用材林高效培育",
            join_year=2015,
            bio='第四代务林人，南京林业大学博士，师从刘森林教授。将无人机、遥感、AI图像识别引入林场监测，是"智慧林场"建设的技术骨干。',
            avatar_color="#a7c957",
        ),
        models.Researcher(
            name="叶青云",
            gender="女",
            birth_year=1998,
            title="硕士研究生/技术员",
            institution="翠竹峡实验林场",
            specialty="相思树引进与无性系选育",
            join_year=2022,
            bio="新一代科研生力军，陈晓苗研究员的学生，负责相思树种质资源评价，建立华南首个相思树基因型-表型数据库。",
            avatar_color="#b5c99a",
        ),
    ]
    db.add_all(researchers)
    db.flush()

    name_to_id = {r.name: r.id for r in researchers}

    stewardships = [
        models.StewardshipRecord(
            plot_id=plot_codes["QY-A-001"],
            researcher_id=name_to_id["陈守林"],
            start_year=1962,
            end_year=1988,
            role="造林主持/技术负责人",
            breeding_work="从当地老林中选出12株杉木优树，采集种子进行育苗。",
            management_work='制定"春栽夏锄秋抚冬防"四季管理法，亲自带队上山抚育。',
            key_achievements='1985年全场率先郁闭成林，被林业部评为"全国荒山造林样板"。',
            handover_notes="交棒李耕耘同志，重点关注优树后代生长表现。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-A-001"],
            researcher_id=name_to_id["李耕耘"],
            start_year=1989,
            end_year=2005,
            role="二代林培育负责人",
            breeding_work="进行杉木第一代子代测定，筛选出3个优良家系。",
            management_work="首次间伐定株，将密度从2500株/公顷调整到1200株。",
            key_achievements="1998年测定：单株材积遗传增益达12%，蓄积超同林分25%。",
            handover_notes="交棒王青山同志，建议开展三代种子园种子造林比较试验。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-A-001"],
            researcher_id=name_to_id["王青山"],
            start_year=2006,
            end_year=2020,
            role="大径材培育主持人",
            breeding_work="建立1.5代种子园，对保留木开展再选择。",
            management_work="实施目标树经营，每公顷保留80-100株目标树，修枝整形。",
            key_achievements="2020年伐区调查：平均胸径32cm，平均树高26m，单株材积0.52m³。",
            handover_notes="交棒陈晓苗同志，建议引入近自然森林经营理念，补植阔叶树。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-A-001"],
            researcher_id=name_to_id["陈晓苗"],
            start_year=2021,
            end_year=None,
            role="近自然改培负责人",
            breeding_work="在林隙补植木荷、枫香等乡土阔叶树苗。",
            management_work="构建复层异龄针阔混交林分结构，引入碳汇计量监测。",
            key_achievements="2025年：生物多样性指数提高30%，碳储量年均增加1.2tC/ha。",
            handover_notes=None,
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-B-017"],
            researcher_id=name_to_id["李耕耘"],
            start_year=1978,
            end_year=1998,
            role="建系主持人",
            breeding_work="从4省17县收集128株马尾松优树，建立种子园。",
            management_work="人工辅助授粉、去劣疏伐，建立双系种子园。",
            key_achievements="通过省林木良种审定委员会审定，每年提供优质种子500kg。",
            handover_notes="交棒王青山，继续开展二代育种群体构建。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-B-017"],
            researcher_id=name_to_id["王青山"],
            start_year=1999,
            end_year=2018,
            role="育种群体主持人",
            breeding_work="完成二代优树选择，营建控制授粉家系测定林。",
            management_work="测交系交配设计，开展配合力分析。",
            key_achievements="二代种子园遗传增益较一代提高8-10%，材积增益15%。",
            handover_notes="交棒陈晓苗，开展基因组选择和分子设计育种。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-B-017"],
            researcher_id=name_to_id["陈晓苗"],
            start_year=2019,
            end_year=None,
            role="基因组育种负责人",
            breeding_work="构建高密度SNP芯片，开展马尾松全基因组选择育种。",
            management_work="建立田间表型+基因组的精准育种平台。",
            key_achievements="构建第一张马尾松高密度遗传图谱，定位12个生长QTL。",
            handover_notes=None,
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["LS-C-009"],
            researcher_id=name_to_id["张绿原"],
            start_year=1975,
            end_year=1995,
            role="造林主持/场长",
            breeding_work="从5个湿地松种源中筛选耐寒种源-佛罗里达种源。",
            management_work="大穴深栽、客土回填，每株浇定根水50kg，存活率92%。",
            key_achievements="1980年洪水冲毁农田2000亩，西岸防护林完好，固土保岸效果显著。",
            handover_notes="交棒刘森林同志，建议在过密林分中补植栎类阔叶树。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["LS-C-009"],
            researcher_id=name_to_id["刘森林"],
            start_year=1996,
            end_year=2016,
            role="林分改培负责人",
            breeding_work="带状间伐后补植栓皮栎、白栎，形成松栎混交。",
            management_work='"三保经营法"：保土保水保生物多样性，禁止皆伐。',
            key_achievements="2015年评估：土壤侵蚀模数减少65%，林下维管植物增加120种。",
            handover_notes="交棒赵新生同志，引入智慧监测，精细化管理每一棵树。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["LS-C-009"],
            researcher_id=name_to_id["赵新生"],
            start_year=2017,
            end_year=None,
            role="智慧林场负责人",
            breeding_work="优树表型精准测定，建立树木生长-冠幅模型。",
            management_work="无人机激光雷达+样地实测，每木级碳储量动态监测。",
            key_achievements='实现全场碳储量年变化估测精度95%以上，获"全国智慧林场"称号。',
            handover_notes=None,
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-E-345"],
            researcher_id=name_to_id["陈晓苗"],
            start_year=2012,
            end_year=2019,
            role="设计主持/长期监测负责人",
            breeding_work="按2:1:1行带比例配置杉木、木荷、枫香，筛选最优混交模式。",
            management_work="设置30个长期固定监测样地，每5年复查一次。",
            key_achievements="2019年：与纯林相比，混交林碳储量高23%，生态服务价值高38%。",
            handover_notes="交棒赵新生同志，利用遥感技术开展全林冠层动态监测。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-E-345"],
            researcher_id=name_to_id["赵新生"],
            start_year=2020,
            end_year=None,
            role="遥感监测技术支持",
            breeding_work=None,
            management_work="卫星遥感+无人机航拍，季度冠层监测，异常生长预警。",
            key_achievements="建立3S技术支持下的森林碳汇动态评估系统。",
            handover_notes=None,
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-D-203"],
            researcher_id=name_to_id["王青山"],
            start_year=1995,
            end_year=2015,
            role="种子园主持人",
            breeding_work="采用1.5代种子园种子造林，营建示范林。",
            management_work="密度调控与修枝试验，建立杉木大径材培育规程。",
            key_achievements="示范林平均单株材积较普通林提高30%以上。",
            handover_notes="交棒陈晓苗，注意引入目标树单株经营。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["QY-D-203"],
            researcher_id=name_to_id["陈晓苗"],
            start_year=2016,
            end_year=None,
            role="目标树经营负责人",
            breeding_work="从保留木中筛选第三代优树候选树。",
            management_work="目标树单株经营，每公顷选留60株，伐除干扰树。",
            key_achievements="建立杉木三代育种群体300个基因型。",
            handover_notes=None,
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["LS-F-128"],
            researcher_id=name_to_id["刘森林"],
            start_year=2003,
            end_year=2020,
            role="次生林改培主持人",
            breeding_work="定向保留目标树种，伐除非目的树种，补植珍贵阔叶树。",
            management_work="生态疏伐+人工促进天然更新，每5年一次作业。",
            key_achievements="由马尾松低效次生林转变为松栎阔复层混交林，蓄积年均增长5%。",
            handover_notes="交棒赵新生，开展长期碳汇动态监测。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["LS-F-128"],
            researcher_id=name_to_id["赵新生"],
            start_year=2021,
            end_year=None,
            role="碳汇监测负责人",
            breeding_work=None,
            management_work="样地每木检尺+无人机LiDAR，建立碳汇计量方法学。",
            key_achievements="2023年该林分通过国家自愿减排CCER方法学备案预核查。",
            handover_notes=None,
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["LS-G-256"],
            researcher_id=name_to_id["刘森林"],
            start_year=2018,
            end_year=2022,
            role="引种负责人",
            breeding_work="筛选南林95、895杨等5个杨树优良无性系。",
            management_work="大苗深栽+秸秆覆盖+滴灌，高度集约经营。",
            key_achievements="4年生平均树高16m，胸径18cm，材积超普通杨树35%。",
            handover_notes="交棒赵新生，开展丰产栽培模型与精准施肥研究。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["LS-G-256"],
            researcher_id=name_to_id["赵新生"],
            start_year=2023,
            end_year=None,
            role="丰产栽培负责人",
            breeding_work="开展无性系×立地×密度交互试验。",
            management_work="建立杨树短周期林生长-养分-水分耦合模型，实现变量施肥。",
            key_achievements="构建林场杨树短轮伐期全周期经营决策支持系统。",
            handover_notes=None,
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["CZ-SH-033"],
            researcher_id=name_to_id["王青山"],
            start_year=1990,
            end_year=2010,
            role="种源试验主持人",
            breeding_work="收集南方12省46个杉木地理种源，建立种源试验林。",
            management_work="每木定位+系谱记录+表型跟踪，建立完整遗传档案。",
            key_achievements="筛选出6个速生、耐寒、抗病的优良种源。",
            handover_notes="交棒林梦绿，注意保存种源种质资源。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["CZ-SH-033"],
            researcher_id=name_to_id["林梦绿"],
            start_year=2011,
            end_year=None,
            role="种质资源保存负责人",
            breeding_work="继续开展种源×立地互作研究，补充多点测定。",
            management_work="建立杉木种源核心种质库+原地保存林，表型-基因型关联分析。",
            key_achievements="首次报道杉木种源层面的光合效率地理变异规律。",
            handover_notes=None,
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["CZ-HN-078"],
            researcher_id=name_to_id["王青山"],
            start_year=2008,
            end_year=2015,
            role="项目总负责人",
            breeding_work="筛选樟树、檫木、木荷、枫香4个树种优良家系。",
            management_work="块状混交，4个树种各25%，设置密度梯度。",
            key_achievements="建立东南地区首个阔叶树高效培育技术体系。",
            handover_notes="交棒林梦绿同志，重点攻关立地生态分类。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["CZ-HN-078"],
            researcher_id=name_to_id["林梦绿"],
            start_year=2016,
            end_year=None,
            role="立地分类主持人",
            breeding_work="筛选5个速生优质樟树家系、3个檫木无性系。",
            management_work='"精确立地+目标材种"定向培育模式，每木级立地评价。',
            key_achievements="樟树优良家系材积超过对照32%，木材密度提高5%。",
            handover_notes=None,
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["CZ-AS-112"],
            researcher_id=name_to_id["陈晓苗"],
            start_year=2021,
            end_year=2021,
            role="项目主持人",
            breeding_work="引进厚荚相思、卷荚相思、黑木相思共20个无性系。",
            management_work="开展无性系对比试验，施肥与密度试验。",
            key_achievements="2年生相思树平均树高8.5m，胸径7.2cm，长势超过预期。",
            handover_notes="交棒叶青云同志，继续深化无性系评价与育种值预测。",
        ),
        models.StewardshipRecord(
            plot_id=plot_codes["CZ-AS-112"],
            researcher_id=name_to_id["叶青云"],
            start_year=2022,
            end_year=None,
            role="无性系评价负责人",
            breeding_work="建立相思树基因型-表型数据库，测定木材性状。",
            management_work="定期监测生长性状，建立育种值预测模型。",
            key_achievements="构建华南首个相思树种质资源评价数据集。",
            handover_notes=None,
        ),
    ]
    db.add_all(stewardships)
    db.flush()

    from .crud import _normalize_stewardship_years

    all_plot_ids = [p.id for p in plots]
    for pid in all_plot_ids:
        _normalize_stewardship_years(db, pid)

    db.commit()
