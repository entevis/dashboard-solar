import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Parse Chilean number format: "2.003,84" → 2003.84, "59,50" → 59.50
function parseCLNumber(s: string): number | null {
  if (!s || s.trim() === "") return null;
  return parseFloat(s.replace(/\./g, "").replace(",", "."));
}

// Parse DD/M/YYYY → Date
function parseCLDate(s: string): Date | null {
  if (!s || s.trim() === "") return null;
  const [d, m, y] = s.split("/");
  return new Date(`${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T12:00:00Z`);
}

const DEFAULT_PORTFOLIO_ID = 1;
const DEFAULT_CUSTOMER_ID = 1;

const RAW = `2\t2\tEl Arenal\tVicuña\tCONAFE\tVicuña CONAFE STX B\t19/1/2017\t25\t59,50\t2.003,84
3\t4\tPuratos\tCerrillos\tENEL DISTRIBUCIÓN\tCerrillos ENEL DISTRIBUCIÓN STX D\t14/1/2017\t25\t100,96\t1.663,47
4\t7\tEconut\tPaine\tCGED\tPaine CGED STX E\t24/4/2017\t25\t95,31\t1.435,74
5\t5\tViña Santa Cruz - Museo del Automóvil\tLolol\tCGED\tLolol CGED STX E\t30/6/2017\t25\t90,72\t1.267,55
6\t6\tViña Santa Cruz - Bodega\tLolol\tCGED\tLolol CGED STX E\t30/6/2017\t25\t108,00\t1.640,14
7\t12\tComalle\tTeno\tCGED\tTeno CGED STX E\t8/11/2017\t25\t93,15\t1.485,93
8\t14\tMontefrutal I\tSagrada Familia\tCGED\tSagrada Familia CGED STX E\t14/11/2017\t25\t62,10\t1.468,11
9\t15\tMontefrutal II\tSagrada Familia\tCGED\tSagrada Familia CGED STX E\t14/11/2017\t25\t62,10\t1.542,82
10\t16\tMontegiallo\tSagrada Familia\tCGED\tSagrada Familia CGED STX E\t14/4/2017\t25\t124,20\t1.502,98
11\t11\tAgrícola Las Delicias\tRequínoa\tCGED\t\t31/10/2017\t25\t97,20\t1.526,33
12\t9\tQuilvo Alto\tRomeral\tCGED\t\t8/11/2017\t25\t64,80\t1.246,44
13\t8\tCotaco\tPudahuel\tENEL DISTRIBUCIÓN\tPudahuel ENEL DISTRIBUCIÓN STX D\t22/11/2017\t25\t116,64\t1.661,31
14\t22\tAlmeval\tPadre Hurtado\tCGED\tPadre Hurtado CGED STX D\t29/3/2018\t25\t91,90\t1.687,13
15\t34\tColegio Villa María Academy\tLas Condes\tENEL DISTRIBUCIÓN\tLas Condes ENEL DISTRIBUCIÓN STX D\t9/4/2018\t25\t31,35\t1.593,87
16\t27\tViu Manent - Bodega\tSanta Cruz\tCGED\tSanta Cruz CGED STX E\t5/3/2018\t25\t118,80\t1.527,66
17\t29\tViu Manent - La Capilla\tPeralillo\tCGED\tPeralillo CGED STX E\t12/4/2018\t25\t92,63\t1.603,85
18\t36\tPolkura\tMarchihue\tCGED\t\t26/4/2018\t20\t125,40\t1.541,83
19\t3\tKesco\tLongaví\tLUZ LINARES\tLongaví LUZ LINARES STX E\t2/5/2018\t25\t88,83\t1.362,67
20\t28\tViu Manent -El Olivar\tPeralillo\tCGED\tPeralillo CGED STX E\t12/4/2018\t25\t123,50\t1.513,88
21\t21\tSagrada Familia A\tSagrada Familia\tCGED\t\t13/6/2018\t20\t125,40\t1.446,58
22\t20\tSagrada Familia B\tSagrada Familia\tCGED\t\t13/6/2018\t20\t125,40\t1.441,86
23\t47\tAgrícola Santa Sara\tPirque\tCGED\t\t19/7/2018\t25\t78,00\t1.822,53
24\t45\tAgrícola Catán\tSan Esteban\tCHILQUINTA\tSan Esteban CHILQUINTA STX C\t23/7/2018\t25\t58,50\t1.871,04
26\t18\tCorrea Albano Itahue A\tMolina\tCGED\t\t8/8/2018\t20\t125,40\t1.498,60
27\t40 - 83\tLos Nogales 1 - Sur + Extensión\tCuricó\tCGED\tCuricó CGED STX E\t20/1/2018\t25\t262,10\t1.519,56
28\t39\tLos Nogales 2 - Norte\tCuricó\tCGED\tCuricó CGED STX E\t3/10/2018\t25\t104,00\t1.407,02
29\t77\tViña Aresti\tRío Claro\tCGED\t\t23/10/2018\t15\t130,00\t1.497,78
30\t48\tColegio Ayelén\tRancagua\tCGED\tRancagua CGED STX E\t30/10/2018\t16\t130,00\t1.525,80
31\t76\tAgrícola Mai\tChépica\tCGED\tChépica CGED STX E\t28/11/2018\t25\t130,00\t1.675,36
32\t68\tEscuela Agrícola San Vicente de Paul\tColtauco\tCGED\t\t30/11/2018\t25\t97,50\t1.685,86
33\t54\tLiceo Mixto Los Andes\tLos Andes\tCHILQUINTA\tLos Andes CHILQUINTA STX C\t6/12/2018\t25\t130,00\t1.625,44
34\t55\tLiceo Mixto San Felipe\tSan Felipe\tCHILQUINTA\tSan Felipe CHILQUINTA STX C\t6/12/2018\t25\t130,00\t1.702,69
35\t52\tAMF Etiquetas\tCerrillos\tENEL DISTRIBUCIÓN\tCerrillos ENEL DISTRIBUCIÓN STX D\t10/1/2019\t15\t150,80\t1.437,44
36\t118\tFrutos Lomai\tCabildo\tCONAFE\t\t21/1/2020\t25\t134,00\t1.742,30
37\t79\tViña Magthen\tLolol\tCGED\tLolol CGED STX E\t24/1/2019\t25\t130,00\t1.518,45
38\t111\tViña Hacienda Araucano\tLolol\tCGED\tLolol CGED STX E\t12/4/2019\t25\t97,50\t1.650,15
39\t57\tVia Wines - Quincho\tSan Rafael\tCGED\tSan Rafael CGED STX E\t15/4/2019\t25\t32,50\t1.527,20
40\t109\tBallica II\tPencahue\tCGED\tPencahue CGED STX E\t16/4/2019\t25\t32,50\t1.651,04
41\t110\tEl Canelo\tPencahue\tCGED\tPencahue CGED STX E\t16/4/2019\t25\t97,50\t1.646,20
42\t96\tViñedos Errazuriz - Pozo Profundo Viluco\tBuin\tCGED\tBuin CGED STX E\t16/4/2019\t25\t130,00\t1.775,21
43\t116\tEmbalajes Troya\tPlacilla\tCGED\tPlacilla CGED STX E\t9/5/2019\t15\t130,00\t1.678,30
44\t44\tSantis Frut\tSan Felipe\tCHILQUINTA\tSan Felipe CHILQUINTA STX C\t31/5/2019\t15\t390,00\t1.665,09
45\t98\tViñedos Errazuriz - Sector Ciruelas Las Mellizas\tMarchihue\tCGED\tMarchihue CGED STX E\t12/6/2019\t25\t130,00\t1.777,83
46\t66\tVia Wines - Caseta de Riego El Condor\tSan Rafael\tCGED\tSan Rafael CGED STX E\t20/6/2019\t25\t132,00\t1.520,81
47\t56\tTribuFood\tPaine\tCGED\tPaine CGED STX E\t27/6/2019\t15\t78,00\t1.610,50
48\t91\tViña Errazuriz - El Chequen\tMarchihue\tCGED\tMarchihue CGED STX E\t2/7/2019\t25\t130,00\t1.671,06
49\t80\tAgrícola El Olivar Ltda\tPeralillo\tCGED\tPeralillo CGED STX E\t3/7/2019\t25\t230,00\t1.613,50
50\t115\tViña Estampa Norte\tMarchihue\tCGED\tMarchihue CGED STX E\t4/7/2019\t20\t97,50\t1.605,30
51\t62\tVia Wines - Caseta de Riego San Juan\tSan Rafael\tCGED\tSan Rafael CGED STX E\t9/7/2019\t25\t211,25\t1.537,10
52\t58\tVia Wines - Vivero\tSan Rafael\tCGED\tSan Rafael CGED STX E\t9/7/2019\t25\t99,00\t1.531,87
53\t90\tViñedos Errazuriz - Casa Enologo\tMarchihue\tCGED\tMarchihue CGED STX E\t27/8/2019\t25\t196,00\t1.602,55
54\t95\tViñedos Errazuriz - La Viña Tierruca\tMarchihue\tCGED\tMarchihue CGED STX E\t27/8/2019\t25\t286,00\t1.627,65
55\t99\tViñedos Errazuriz - Sector El Risco\tMarchihue\tCGED\tMarchihue CGED STX E\t30/8/2019\t25\t32,50\t1.696,63
56\t88\tViñedos Errazuriz - Campamento\tPeralillo\tCGED\tPeralillo CGED STX E\t5/9/2019\t25\t130,00\t1.650,77
57\t94\tViñedos Errazuriz - Fundo Nilahue\tPumanque\tCGED\tPumanque CGED STX E\t5/9/2019\t25\t130,00\t1.670,62
58\t71\tAgrifutura\tSan Esteban\tCHILQUINTA\t\t10/9/2019\t25\t260,00\t1.763,47
59\t97\tViñedos Errazuriz - Sector Acopio\tPichidegua\tCGED\tPichidegua CGED STX E\t16/10/2019\t25\t130,00\t1.649,41
60\t117\tAgrícola La Reina\tMelipilla\tCGED\tMelipilla CGED STX E\t16/10/2019\t20\t104,48\t1.646,80
61\t132\tAgrícola Cahuelmo\tOvalle\tCONAFE\tOvalle CONAFE STX B\t5/11/2019\t15\t201,00\t1.625,05
62\t112\tTerrafrut\tMalloa\tCGED\tMalloa CGED STX E\t13/11/2019\t25\t390,00\t1.575,25
63\t60\tVia Wines - Sector Agrícola\tSan Rafael\tCGED\tSan Rafael CGED STX E\t18/11/2019\t25\t45,50\t1.608,13
64\t114\tViña Estampa Sur\tMarchihue\tCGED\tMarchihue CGED STX E\t19/11/2019\t20\t104,00\t1.623,23
65\t113\tViña Undurraga\tCauquenes\tCGED\t\t26/11/2019\t25\t286,00\t1.642,12
66\t121\tAgrícola San Nicolás\tMelipilla\tCGED\t\t29/11/2019\t25\t393,00\t1.675,22
67\t133\tAgrícola San Antonio\tLas Cabras\tCGED\tLas Cabras CGED STX E\t10/12/2019\t25\t134,00\t1.478,82
68\t128\tAgrícola Antumapu\tSan Fernando\tCGED\t\t30/1/2020\t25\t93,80\t1.646,95
69\t129\tLos Olmos\tChimbarongo\tCGED\t\t30/1/2020\t25\t134,00\t1.356,20
70\t144\tAgrícola El Boldo - Viña Encierra\tPeralillo\tCGED\tPeralillo CGED STX E\t6/2/2020\t25\t268,00\t1.573,03
71\t67\tVia Wines - Lontué\tCuricó\tCEC\tCuricó CEC STX E\t20/2/2020\t25\t117,92\t1.454,02
72\t65\tVia Wines - Tapihue\tCasablanca\tEDECSA\tCasablanca EDECSA STX C\t11/3/2020\t25\t60,30\t1.454,02
74\t30\tViu Manent - Turismo\tNancagua\tCGED\tNancagua CGED STX E\t31/3/2020\t25\t134,00\t1.572,35
75\t135\tRincon del Ñilhue\tCatemu\tCHILQUINTA\tCatemu CHILQUINTA STX C\t28/4/2020\t25\t402,00\t1.752,34
76\t64\tVia Wines - Caseta de Riego La Esperanza\tSan Rafael\tCGED\tSan Rafael CGED STX E\t28/5/2020\t25\t241,20\t1.407,34
77\t10 - 143\tFrutexsa Raisins\tPanquehue\tCHILQUINTA\tPanquehue CHILQUINTA STX C\t9/6/2020\t25\t254,09\t1.546,90
78\t136\tHuertos Del Valle\tCatemu\tCHILQUINTA\tCatemu CHILQUINTA STX C\t10/6/2020\t25\t403,00\t1.597,17
79\t155\tViña Ureta Bodega\tPeralillo\tCGED\tPeralillo CGED STX E\t18/6/2020\t15\t148,50\t1.463,35
80\t87\tOWM Los Maitenes 40\tSanta Cruz\tCGED\tSanta Cruz CGED STX E\t28/6/2019\t25\t52,80\t1.637,13
81\t186\tOWM Los Maitenes Sur 75\tSanta Cruz\tCGED\tSanta Cruz CGED STX E\t11/8/2020\t25\t101,25\t1.633,98
82\t156\tViña Ureta Parcela 45\tPeralillo\tCGED\tPeralillo CGED STX E\t13/8/2020\t15\t303,75\t1.595,05
83\t154\tAgrícola Las Vides\tNancagua\tCGED\tNancagua CGED STX E\t31/8/2020\t25\t135,00\t1.570,65
84\t180\tAvicola Santa Teresita\tPaine\tCGED\tPaine CGED STX E\t11/9/2020\t25\t202,50\t1.697,89
85\t170\tPrunesco\tPirque\tCGED\t\t16/11/2020\t25\t405,00\t1.239,37
86\t72\tCaimi\tCasablanca\tEDECSA\t\t30/11/2020\t20\t265,00\t1.581,49
87\t201\tAgrícola Las Tres Marías\tNancagua\tCGED\tNancagua CGED STX E\t2/1/2021\t20\t133,92\t1.685,96
88\t203\tInaplast\tSan Bernardo\tCGED\tSan Bernardo CGED STX D\t26/1/2021\t15\t71,10\t1.612,23
89\t193\tGioia\tSan Felipe\tCHILQUINTA\tSan Felipe CHILQUINTA STX C\t28/4/2021\t10\t233,28\t1.757,83
90\t205\tVivero Limache\tLimache\tCHILQUINTA\tLimache CHILQUINTA STX C\t2/9/2021\t15\t145,80\t1.618,35
91\t26 - 231\tCasas del Toqui + Expansión\tRequínoa\tCGED\tRequínoa CGED STX E\t17/12/2021\t22\t297,00\t1.562,68
92\t223\tAgrícola Valle Centro\tSanta María\tCHILQUINTA\tSanta María CHILQUINTA STX C\t9/6/2022\t10\t414,72\t1.796,96
93\t75 - 149\tAgroplan + Expansión\tChépica\tCGED\tChépica CGED STX E\t1/8/2022\t22\t197,00\t1.629,22
95\t162\tCyT - Centro de Investigación CII\tPencahue\tCGED\tPencahue CGED STX E\t24/11/2020\t15\t244,86\t1.566,68
96\t163\tCyT - Fundo Lourdes\tPencahue\tCGED\tPencahue CGED STX E\t7/1/2021\t15\t213,30\t1.593,00
97\t164\tCyT - Idahue\tSan Vicente\tCGED\tSan Vicente CGED STX E\t17/3/2021\t15\t227,52\t1.615,63
98\t165\tCyT - Peumo\tPeumo\tCGED\tPeumo CGED STX E\t14/10/2020\t15\t101,25\t1.592,71
99\t166\tCyT - San Manuel\tTeno\tCGED\tTeno CGED STX E\t15/12/2020\t15\t108,72\t1.565,14
100\t167\tCyT - Fundo Rauco\tRauco\tCGED\tRauco CGED STX E\t20/11/2020\t15\t138,60\t1.549,17
101\t168\tCyT - Fundo Villa Alegre\tSan Javier\tCGED\tSan Javier CGED STX E\t24/9/2020\t15\t129,60\t1.619,53
102\t169\tCyT - Fundo El Triángulo\tCasablanca\tEDECSA\tCasablanca EDECSA STX C\t14/10/2020\t15\t114,75\t1.635,66
103\t183\tCyT - El Estero\tNancagua\tCGED\tNancagua CGED STX E\t31/8/2020\t15\t108,00\t1.537,63
104\t184\tCyT - Q del Agua\tSan Clemente\tCGED\tSan Clemente CGED STX E\t18/8/2020\t15\t189,00\t1.535,91
105\t185\tCyT - Santa Raquel\tPencahue\tCGED\tPencahue CGED STX E\t9/12/2020\t15\t199,08\t1.596,12
106\t249\tAgrícola El Capricho\tMelipilla\tCGED\tMelipilla CGED STX E\t14/10/2022\t15\t289,56\t1.575,82
109\t252\tExpansión Agroplan 2\tChépica\tCGED\tChépica CGED STX E\t29/11/2022\t22\t218,88\t1.548,28
112\t281\tPersea Opco 100\tSan Esteban\tCHILQUINTA\tSan Esteban CHILQUINTA STX C\t16/1/2023\t22.5\t144,00\t1.799,89
114\t313\tAgrícola Las Cañas\tIllapel\tCONAFE\tIllapel CONAFE STX B\t23/6/2023\t10\t387,03\t1.800,77
115\t275\tISD - Planta Procesadora\tEl Monte\tCGED\tEl Monte CGED STX E\t28/6/2023\t15\t436,00\t1.642,82
120\t308\tEl Canelo II\tPencahue\tCGED\tPencahue CGED STX E\t4/10/2023\t20\t198,00\t1.664,21
121\t364\tAgrícola Alfa\tMostazal\tCGED\tMostazal CGED STX E\t4/1/2024\t10\t202,40\t1.756,89
122\t359\tForestal INH\tCabildo\tCONAFE\tCabildo CONAFE STX B\t7/2/2024\t15\t136,80\t1.915,10
123\t328\tAgrícola San Nicolás (150)\tCalle Larga\tCHILQUINTA\tCalle Larga CHILQUINTA STX C\t10/8/2023\t15\t198,00\t1.874,38
124\t282\tPersea Opco 300\tSan Esteban\tCHILQUINTA\tSan Esteban CHILQUINTA STX C\t14/5/2024\t10\t401,14\t1.884,26
125\t327\tAgrícola Las Mercedes\tCabildo\tCONAFE\tCabildo CONAFE STX B\t29/2/2024\t15\t327,00\t1.738,65
126\t355\tAgrícola María del Rosario (Orocoipo)\tSan Felipe\tCHILQUINTA\tSan Felipe CHILQUINTA STX C\t15/1/2024\t10\t416,10\t1.836,67
127\t428\tComercial Rocky\tHijuelas\tCHILQUINTA\tHijuelas CHILQUINTA STX C\t10/6/2024\t15\t166,76\t1.711,24
128\t356\tEfosur\tCauquenes\tCGED\tCauquenes CGED STX E\t4/8/2025\t14\t414,00\t1.705,67
129\t366\tAgrícola El Sauce (Vicente Crespo)\tChépica\tCGED\tChépica CGED STX E\t10/5/2024\t15\t165,60\t1.675,64
130\t443\tAgrícola Caillihue\tSanta Cruz\tCGED\tSanta Cruz CGED STX E\t28/6/2024\t26\t206,36\t1.692,85
131\t399\tAgrícola San Sebastián\tCuricó\tCGED\tCuricó CGED STX E\t9/10/2024\t15\t410,04\t1.551,01
132\t322\tRío Blanco (RB) - Goyo Díaz I\tTierra Amarilla\tEMELAT\tTierra Amarilla EMELAT STX B\t29/8/2024\t10\t413,10\t2.075,48
133\t326\tRío Blanco (RB) - Chapilca\tVicuña\tCONAFE\tVicuña CONAFE STX B\t21/11/2023\t10\t239,46\t1.916,38
134\t381\tAgricola Ocoa - Loma 18\tHijuelas\tCHILQUINTA\tHijuelas CHILQUINTA STX C\t25/6/2024\t10\t414,00\t1.725,65
135\t382\tAgrícola Ocoa - Paltos Casa\tHijuelas\tCHILQUINTA\tHijuelas CHILQUINTA STX C\t1/7/2024\t10\t414,00\t1.718,34
136\t464\tAgropecuaria Wapri (Marengo)\tCuricó\tCEC\tCuricó CEC STX E\t22/1/2025\t10\t415,80\t1.651,46
137\t395\tViña Terranoble San Clemente\tSan Clemente\tCGED\tSan Clemente CGED STX E\t7/11/2024\t10\t411,84\t1.667,67
138\t130\tViña San Pedro de Tarapacá\tMolina\tCGED\t\t30/10/2020\t20\t1128,10\t1.466,59
139\t274\tISD - Planta Lechería\tEl Monte\tCGED\tEl Monte CGED STX E\t20/3/2025\t15\t405,48\t1.726,59
140\t452\tSanta Marta C\tPaine\tCGED\tPaine CGED STX E\t30/1/2025\t8\t330,00\t1.814,55
141\t456\tGrupo Eco II\tLampa\tENEL DISTRIBUCIÓN\tLampa ENEL DISTRIBUCIÓN STX D\t18/2/2025\t8\t138,60\t1.673,58
142\t342\tUnifrutti - Fundo Stefania\tSan Felipe\tCHILQUINTA\tSan Felipe CHILQUINTA STX C\t4/12/2023\t10\t415,97\t1.859,46
143\t343\tUnifrutti - Fundo Lo Calvo\tSan Esteban\tCHILQUINTA\tSan Esteban CHILQUINTA STX C\t26/6/2024\t10\t368,54\t1.839,15
144\t370\tAgro San Antonio O. Barrientos\tPichidegua\tCGED\tPichidegua CGED STX E\t20/3/2025\t15\t309,89\t1.690,53
145\t305\tAlfalfas Baldrich\tMaría Pinto\tCGED\tMaría Pinto CGED STX E\t6/3/2025\t13.5\t396,00\t1.725,52
146\t500\tMall Plaza Parking (CL)\tLa Florida\tENEL DISTRIBUCIÓN\t\t20/5/2025\t10\t1234,10\t1.801,52
147\t497\tAgrícola Mai II\tChépica\tCGED\tChépica CGED STX E\t6/8/2025\t20\t138,60\t1.685,48
148\t320\tSaint Joseph School\tHuechuraba\tENEL DISTRIBUCIÓN\tHuechuraba ENEL DISTRIBUCIÓN STX D\t12/1/2024\t25\t112,86\t1.799,36
149\t325\tRío Blanco (RB) - San Antonio\tMonte Patria\tCONAFE\tMonte Patria CONAFE STX B\t10/9/2025\t10\t151,80\t2.049,68
150\t526\tHuerto Los Molinos\tPeumo\tCGED\tPeumo CGED STX E\t10/10/2025\t15\t417,48\t1.641,80
151\t323\tRío Blanco (RB) - Goyo Díaz II\tTierra Amarilla\tEMELAT\tTierra Amarilla EMELAT STX B\t10/12/2025\t10\t413,10\t2.082,90`;

async function main() {
  // Soft-delete existing dummy plants
  const deleted = await prisma.powerPlant.updateMany({
    where: { id: { lt: 0 } },
    data: { active: 0 },
  });
  console.log(`Soft-deleted ${deleted.count} dummy plants`);

  const lines = RAW.trim().split("\n");
  let created = 0;

  for (const line of lines) {
    const cols = line.split("\t");
    if (cols.length < 10) continue;

    const [, solcorIdRaw, name, city, distributorCompany, tariffId, dateStr, durationRaw, capacityRaw, yieldRaw] = cols;

    const solcorId = solcorIdRaw.trim() || null;
    const capacityKw = parseCLNumber(capacityRaw.trim());
    const specificYield = parseCLNumber(yieldRaw.trim());
    const startDate = parseCLDate(dateStr.trim());
    const durationYears = durationRaw.trim() ? parseFloat(durationRaw.trim()) : null;

    if (!capacityKw) {
      console.warn(`Skipping row (no capacity): ${name}`);
      continue;
    }

    await prisma.powerPlant.create({
      data: {
        name: name.trim(),
        city: city.trim() || null,
        distributorCompany: distributorCompany.trim() || null,
        tariffId: tariffId.trim() || null,
        solcorId,
        capacityKw,
        specificYield,
        startDate,
        durationYears,
        portfolioId: DEFAULT_PORTFOLIO_ID,
        customerId: DEFAULT_CUSTOMER_ID,
        status: "active",
      },
    });
    created++;
    process.stdout.write(`\r  Imported ${created}/${lines.length}: ${name.trim().substring(0, 40)}`);
  }

  console.log(`\n✓ Done — ${created} plants imported`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  prisma.$disconnect();
  process.exit(1);
});
