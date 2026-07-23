export const sharedListCase1 = `México (MEX)   17/20
MEX4  MEX13  MEX18

 África do Sul (RSA)   19/20
RSA9

 Coreia do Sul (KOR)   17/20
KOR11  KOR15  KOR16

República Tcheca (CZE)   16/20
CZE2  CZE3  CZE12  CZE19

 Canadá (CAN)   19/20
CAN13

Bósnia e Herzegovina (BIH)   19/20
BIH9

 Catar (QAT)   18/20
QAT10  QAT19

 Suíça (SUI)   19/20
SUI20

 Brasil (BRA)   16/20
BRA1  BRA10  BRA14  BRA19

 Marrocos (MAR)   19/20
MAR19

 Haiti (HAI)   15/20
HAI3  HAI5  HAI7  HAI8  HAI13

 EUA (USA)   19/20
USA3

 Austrália (AUS)   17/20
AUS7  AUS8  AUS14

 Alemanha (GER)   17/20
GER1  GER6  GER19

 Curaçao (CUW)   18/20
CUW13  CUW20

 Costa do Marfim (CIV)   19/20
CIV5

 Equador (ECU)   18/20
ECU7  ECU17

 Holanda (NED)   17/20
NED1  NED2  NED3

Suécia (SWE)   19/20
SWE1

 Bélgica (BEL)   18/20
BEL3  BEL20

 Egito (EGY)   17/20
EGY5  EGY8  EGY12

 Irã (IRN)   15/20
IRN4  IRN8  IRN10  IRN16  IRN18

 Nova Zelândia (NZL)   19/20
NZL17

 Espanha (ESP)   17/20
ESP2  ESP6  ESP14

 Arábia Saudita (KSA)   11/20
KSA1  KSA4  KSA5  KSA8  KSA11  KSA15  KSA16  KSA19  KSA20

 Uruguai (URU)   18/20
URU2  URU6

 França (FRA)   19/20
FRA15

 Iraque (IRQ)   14/20
IRQ4  IRQ6  IRQ9  IRQ12  IRQ14  IRQ16

 Noruega (NOR)   17/20
NOR7  NOR8  NOR12

 Argentina (ARG)   17/20
ARG5  ARG18  ARG19

 Argélia (ALG)   18/20
ALG7  ALG14

 Portugal (POR)   14/20
POR1  POR8  POR9  POR12  POR14  POR17

 RD Congo (COD)   13/20
COD1  COD4  COD6  COD7  COD12  COD13  COD17

 Uzbequistão (UZB)   18/20
UZB1  UZB5

 Colômbia (COL)   17/20
COL3  COL16  COL20

 Inglaterra (ENG)   19/20
ENG19

 Gana (GHA)   19/20
GHA9

 Panamá (PAN)   14/20
PAN4  PAN6  PAN8  PAN12  PAN17  PAN19Coleção Coca-Cola (CC)   12/14
CC5  CC8`;

export const sharedListCase1Expected = {
  mexico: [4, 13, 18],
  "africa-do-sul": [9],
  "coreia-do-sul": [11, 15, 16],
  tchequia: [2, 3, 12, 19],
  canada: [13],
  "bosnia-herzegovina": [9],
  catar: [10, 19],
  suica: [20],
  brasil: [1, 10, 14, 19],
  marrocos: [19],
  haiti: [3, 5, 7, 8, 13],
  "estados-unidos": [3],
  australia: [7, 8, 14],
  alemanha: [1, 6, 19],
  curacao: [13, 20],
  "costa-do-marfim": [5],
  equador: [7, 17],
  "paises-baixos": [1, 2, 3],
  suecia: [1],
  belgica: [3, 20],
  egito: [5, 8, 12],
  ira: [4, 8, 10, 16, 18],
  "nova-zelandia": [17],
  espanha: [2, 6, 14],
  "arabia-saudita": [1, 4, 5, 8, 11, 15, 16, 19, 20],
  uruguai: [2, 6],
  franca: [15],
  iraque: [4, 6, 9, 12, 14, 16],
  noruega: [7, 8, 12],
  argentina: [5, 18, 19],
  argelia: [7, 14],
  portugal: [1, 8, 9, 12, 14, 17],
  "rd-congo": [1, 4, 6, 7, 12, 13, 17],
  uzbequistao: [1, 5],
  colombia: [3, 16, 20],
  inglaterra: [19],
  gana: [9],
  panama: [4, 6, 8, 12, 17, 19],
  "coca-cola": [5, 8]
};

export const sharedListCase2 = `Faltantes
FWC : 8
MEX : 1, 4
RSA : 17
KOR : 14, 16, 20
CZE : 2, 12, 13, 17
CAN : 9, 13, 14, 20
BIH : 2, 4
QAT : 1, 19
SUI : 1, 18
BRA : 5, 16
HAI : 11, 15, 16, 19
SCO : 15, 16, 17
USA : 5
PAR : 20
AUS : 4
TUR : 8, 19, 20
GER : 13, 14
CUW : 9, 10, 13, 20
CIV : 10, 14
ECU : 7, 8
NED : 6, 7, 17
JPN : 4
SWE : 1, 13, 16
TUN : 4, 5
BEL : 4, 8, 9, 16, 20
EGY : 5, 8, 10, 11, 12, 19
IRN : 2, 8, 11, 18
NZL : 17
ESP : 2, 4, 6, 7, 9, 10, 11, 12, 13, 16, 18, 20
CPV : 2
KSA : 4
URU : 2, 4, 9, 10
FRA : 3, 11, 13
SEN : 11
IRQ : 1, 4, 6, 8, 12, 13, 14, 18
NOR : 4, 7, 8, 12, 17
ARG : 5, 9, 15, 19
ALG : 20
AUT : 9
JOR : 10, 11, 15, 20
POR : 1, 8
COD : 6, 11, 12, 15, 20
UZB : 5, 14, 15, 16
COL : 7, 11, 14, 16
ENG : 12, 19
CRO : 1
GHA : 5, 7, 16
PAN : 2, 4, 7, 8, 11, 16, 19`;

export const sharedListCase2Expected = {
  fwc: [8],
  mexico: [1, 4],
  "africa-do-sul": [17],
  "coreia-do-sul": [14, 16, 20],
  tchequia: [2, 12, 13, 17],
  canada: [9, 13, 14, 20],
  "bosnia-herzegovina": [2, 4],
  catar: [1, 19],
  suica: [1, 18],
  brasil: [5, 16],
  haiti: [11, 15, 16, 19],
  escocia: [15, 16, 17],
  "estados-unidos": [5],
  paraguai: [20],
  australia: [4],
  turquia: [8, 19, 20],
  alemanha: [13, 14],
  curacao: [9, 10, 13, 20],
  "costa-do-marfim": [10, 14],
  equador: [7, 8],
  "paises-baixos": [6, 7, 17],
  japao: [4],
  suecia: [1, 13, 16],
  tunisia: [4, 5],
  belgica: [4, 8, 9, 16, 20],
  egito: [5, 8, 10, 11, 12, 19],
  ira: [2, 8, 11, 18],
  "nova-zelandia": [17],
  espanha: [2, 4, 6, 7, 9, 10, 11, 12, 13, 16, 18, 20],
  "cabo-verde": [2],
  "arabia-saudita": [4],
  uruguai: [2, 4, 9, 10],
  franca: [3, 11, 13],
  senegal: [11],
  iraque: [1, 4, 6, 8, 12, 13, 14, 18],
  noruega: [4, 7, 8, 12, 17],
  argentina: [5, 9, 15, 19],
  argelia: [20],
  austria: [9],
  jordania: [10, 11, 15, 20],
  portugal: [1, 8],
  "rd-congo": [6, 11, 12, 15, 20],
  uzbequistao: [5, 14, 15, 16],
  colombia: [7, 11, 14, 16],
  inglaterra: [12, 19],
  croacia: [1],
  gana: [5, 7, 16],
  panama: [2, 4, 7, 8, 11, 16, 19]
};

export function expectedIdsFromGroups(groups) {
  return Object.entries(groups).flatMap(([sectionId, numbers]) => numbers.map((number) => `${sectionId}-${number}`));
}

export function expectedTotal(groups) {
  return Object.values(groups).reduce((sum, numbers) => sum + numbers.length, 0);
}