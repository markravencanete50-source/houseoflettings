// operatingAreaPostcodes.ts
// District-level postcode coverage for House of Lettings' operating areas.
// Source: Royal Mail / Wikipedia postcode area pages, verified June 2026.
// Each district maps to a pricing tier used by valuationEngine.ts

export type PricingTier =
  | 'leeds_city'
  | 'leeds_inner'
  | 'leeds_outer'
  | 'manchester_city'
  | 'manchester_inner'
  | 'manchester_outer'
  | 'bradford_city'
  | 'bradford_outer'
  | 'wakefield'
  | 'huddersfield'
  | 'halifax'
  | 'harrogate'
  | 'york'
  | 'sheffield_city'
  | 'sheffield_outer'
  | 'doncaster'
  | 'hull'
  | 'yorkshire_general';

export interface DistrictInfo {
  area: string;           // e.g. "Leeds"
  subArea: string;        // e.g. "Leeds City Centre"
  tier: PricingTier;
  region: 'yorkshire' | 'greater_manchester';
}

// ─────────────────────────────────────────────────────────────
// LS — Leeds (29 districts)
// ─────────────────────────────────────────────────────────────
const lsDistricts: Record<string, DistrictInfo> = {
  LS1:  { area: 'Leeds', subArea: 'Leeds City Centre',       tier: 'leeds_city',  region: 'yorkshire' },
  LS2:  { area: 'Leeds', subArea: 'Leeds City Centre',       tier: 'leeds_city',  region: 'yorkshire' },
  LS3:  { area: 'Leeds', subArea: 'Woodhouse / Hyde Park',   tier: 'leeds_inner', region: 'yorkshire' },
  LS4:  { area: 'Leeds', subArea: 'Kirkstall',               tier: 'leeds_inner', region: 'yorkshire' },
  LS5:  { area: 'Leeds', subArea: 'Burley',                  tier: 'leeds_inner', region: 'yorkshire' },
  LS6:  { area: 'Leeds', subArea: 'Headingley',              tier: 'leeds_inner', region: 'yorkshire' },
  LS7:  { area: 'Leeds', subArea: 'Chapel Allerton',         tier: 'leeds_inner', region: 'yorkshire' },
  LS8:  { area: 'Leeds', subArea: 'Roundhay / Moortown',     tier: 'leeds_inner', region: 'yorkshire' },
  LS9:  { area: 'Leeds', subArea: 'East End / Harehills',    tier: 'leeds_inner', region: 'yorkshire' },
  LS10: { area: 'Leeds', subArea: 'Hunslet / Beeston',       tier: 'leeds_inner', region: 'yorkshire' },
  LS11: { area: 'Leeds', subArea: 'Beeston / Holbeck',       tier: 'leeds_inner', region: 'yorkshire' },
  LS12: { area: 'Leeds', subArea: 'Armley / New Wortley',    tier: 'leeds_inner', region: 'yorkshire' },
  LS13: { area: 'Leeds', subArea: 'Bramley / Rodley',        tier: 'leeds_outer', region: 'yorkshire' },
  LS14: { area: 'Leeds', subArea: 'Seacroft / Swarcliffe',   tier: 'leeds_outer', region: 'yorkshire' },
  LS15: { area: 'Leeds', subArea: 'Crossgates / Halton',     tier: 'leeds_outer', region: 'yorkshire' },
  LS16: { area: 'Leeds', subArea: 'Cookridge / Adel',        tier: 'leeds_outer', region: 'yorkshire' },
  LS17: { area: 'Leeds', subArea: 'Alwoodley / Shadwell',    tier: 'leeds_outer', region: 'yorkshire' },
  LS18: { area: 'Leeds', subArea: 'Horsforth',               tier: 'leeds_outer', region: 'yorkshire' },
  LS19: { area: 'Leeds', subArea: 'Yeadon / Rawdon',         tier: 'leeds_outer', region: 'yorkshire' },
  LS20: { area: 'Leeds', subArea: 'Guiseley',                tier: 'leeds_outer', region: 'yorkshire' },
  LS21: { area: 'Leeds', subArea: 'Otley / Pool',            tier: 'leeds_outer', region: 'yorkshire' },
  LS22: { area: 'Leeds', subArea: 'Wetherby',                tier: 'leeds_outer', region: 'yorkshire' },
  LS23: { area: 'Leeds', subArea: 'Boston Spa / Tadcaster',  tier: 'leeds_outer', region: 'yorkshire' },
  LS24: { area: 'Leeds', subArea: 'Tadcaster',               tier: 'leeds_outer', region: 'yorkshire' },
  LS25: { area: 'Leeds', subArea: 'Garforth / Kippax',       tier: 'leeds_outer', region: 'yorkshire' },
  LS26: { area: 'Leeds', subArea: 'Rothwell / Oulton',       tier: 'leeds_outer', region: 'yorkshire' },
  LS27: { area: 'Leeds', subArea: 'Morley / Gildersome',     tier: 'leeds_outer', region: 'yorkshire' },
  LS28: { area: 'Leeds', subArea: 'Pudsey / Stanningley',    tier: 'leeds_outer', region: 'yorkshire' },
  LS29: { area: 'Leeds', subArea: 'Ilkley / Burley-in-Wharfedale', tier: 'leeds_outer', region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// BD — Bradford (24 districts)
// ─────────────────────────────────────────────────────────────
const bdDistricts: Record<string, DistrictInfo> = {
  BD1:  { area: 'Bradford', subArea: 'Bradford City Centre',  tier: 'bradford_city',  region: 'yorkshire' },
  BD2:  { area: 'Bradford', subArea: 'Bradford East',         tier: 'bradford_city',  region: 'yorkshire' },
  BD3:  { area: 'Bradford', subArea: 'Bradford East',         tier: 'bradford_city',  region: 'yorkshire' },
  BD4:  { area: 'Bradford', subArea: 'Bradford South',        tier: 'bradford_city',  region: 'yorkshire' },
  BD5:  { area: 'Bradford', subArea: 'Bradford South',        tier: 'bradford_city',  region: 'yorkshire' },
  BD6:  { area: 'Bradford', subArea: 'Wyke / Low Moor',       tier: 'bradford_city',  region: 'yorkshire' },
  BD7:  { area: 'Bradford', subArea: 'Great Horton',          tier: 'bradford_city',  region: 'yorkshire' },
  BD8:  { area: 'Bradford', subArea: 'Manningham',            tier: 'bradford_city',  region: 'yorkshire' },
  BD9:  { area: 'Bradford', subArea: 'Heaton / Frizinghall',  tier: 'bradford_city',  region: 'yorkshire' },
  BD10: { area: 'Bradford', subArea: 'Idle / Eccleshill',     tier: 'bradford_outer', region: 'yorkshire' },
  BD11: { area: 'Bradford', subArea: 'Birkenshaw / Drighlington', tier: 'bradford_outer', region: 'yorkshire' },
  BD12: { area: 'Bradford', subArea: 'Wyke / Low Moor',       tier: 'bradford_outer', region: 'yorkshire' },
  BD13: { area: 'Bradford', subArea: 'Queensbury / Thornton', tier: 'bradford_outer', region: 'yorkshire' },
  BD14: { area: 'Bradford', subArea: 'Clayton / Queensbury',  tier: 'bradford_outer', region: 'yorkshire' },
  BD15: { area: 'Bradford', subArea: 'Allerton / Sandy Lane', tier: 'bradford_outer', region: 'yorkshire' },
  BD16: { area: 'Bradford', subArea: 'Bingley',               tier: 'bradford_outer', region: 'yorkshire' },
  BD17: { area: 'Bradford', subArea: 'Shipley / Baildon',     tier: 'bradford_outer', region: 'yorkshire' },
  BD18: { area: 'Bradford', subArea: 'Shipley / Saltaire',    tier: 'bradford_outer', region: 'yorkshire' },
  BD19: { area: 'Bradford', subArea: 'Cleckheaton / Gomersal',tier: 'bradford_outer', region: 'yorkshire' },
  BD20: { area: 'Bradford', subArea: 'Steeton / Keighley',    tier: 'bradford_outer', region: 'yorkshire' },
  BD21: { area: 'Bradford', subArea: 'Keighley',              tier: 'bradford_outer', region: 'yorkshire' },
  BD22: { area: 'Bradford', subArea: 'Haworth / Oxenhope',    tier: 'bradford_outer', region: 'yorkshire' },
  BD23: { area: 'Bradford', subArea: 'Skipton',               tier: 'harrogate',      region: 'yorkshire' },
  BD24: { area: 'Bradford', subArea: 'Settle',                tier: 'harrogate',      region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// M — Greater Manchester (46 districts)
// ─────────────────────────────────────────────────────────────
const mDistricts: Record<string, DistrictInfo> = {
  M1:  { area: 'Manchester', subArea: 'Manchester City Centre',      tier: 'manchester_city',  region: 'greater_manchester' },
  M2:  { area: 'Manchester', subArea: 'Manchester City Centre',      tier: 'manchester_city',  region: 'greater_manchester' },
  M3:  { area: 'Manchester', subArea: 'Manchester City Centre',      tier: 'manchester_city',  region: 'greater_manchester' },
  M4:  { area: 'Manchester', subArea: 'Northern Quarter / Ancoats',  tier: 'manchester_city',  region: 'greater_manchester' },
  M5:  { area: 'Manchester', subArea: 'Salford',                     tier: 'manchester_inner', region: 'greater_manchester' },
  M6:  { area: 'Manchester', subArea: 'Salford / Pendleton',         tier: 'manchester_inner', region: 'greater_manchester' },
  M7:  { area: 'Manchester', subArea: 'Higher Broughton',            tier: 'manchester_inner', region: 'greater_manchester' },
  M8:  { area: 'Manchester', subArea: 'Cheetham Hill / Crumpsall',   tier: 'manchester_inner', region: 'greater_manchester' },
  M9:  { area: 'Manchester', subArea: 'Moston / Collyhurst',         tier: 'manchester_inner', region: 'greater_manchester' },
  M11: { area: 'Manchester', subArea: 'Openshaw',                    tier: 'manchester_inner', region: 'greater_manchester' },
  M12: { area: 'Manchester', subArea: 'Longsight / Ardwick',         tier: 'manchester_inner', region: 'greater_manchester' },
  M13: { area: 'Manchester', subArea: 'Longsight / Moss Side',       tier: 'manchester_inner', region: 'greater_manchester' },
  M14: { area: 'Manchester', subArea: 'Fallowfield / Withington',    tier: 'manchester_inner', region: 'greater_manchester' },
  M15: { area: 'Manchester', subArea: 'Hulme / Castlefield',         tier: 'manchester_inner', region: 'greater_manchester' },
  M16: { area: 'Manchester', subArea: 'Stretford / Whalley Range',   tier: 'manchester_inner', region: 'greater_manchester' },
  M17: { area: 'Manchester', subArea: 'Trafford Park',               tier: 'manchester_inner', region: 'greater_manchester' },
  M18: { area: 'Manchester', subArea: 'Gorton',                      tier: 'manchester_inner', region: 'greater_manchester' },
  M19: { area: 'Manchester', subArea: 'Levenshulme / Burnage',       tier: 'manchester_inner', region: 'greater_manchester' },
  M20: { area: 'Manchester', subArea: 'Didsbury / Withington',       tier: 'manchester_inner', region: 'greater_manchester' },
  M21: { area: 'Manchester', subArea: 'Chorlton',                    tier: 'manchester_inner', region: 'greater_manchester' },
  M22: { area: 'Manchester', subArea: 'Northenden / Wythenshawe',    tier: 'manchester_outer', region: 'greater_manchester' },
  M23: { area: 'Manchester', subArea: 'Wythenshawe / Benchill',      tier: 'manchester_outer', region: 'greater_manchester' },
  M24: { area: 'Manchester', subArea: 'Middleton',                   tier: 'manchester_outer', region: 'greater_manchester' },
  M25: { area: 'Manchester', subArea: 'Prestwich',                   tier: 'manchester_outer', region: 'greater_manchester' },
  M26: { area: 'Manchester', subArea: 'Radcliffe',                   tier: 'manchester_outer', region: 'greater_manchester' },
  M27: { area: 'Manchester', subArea: 'Swinton / Pendlebury',        tier: 'manchester_outer', region: 'greater_manchester' },
  M28: { area: 'Manchester', subArea: 'Worsley / Boothstown',        tier: 'manchester_outer', region: 'greater_manchester' },
  M29: { area: 'Manchester', subArea: 'Tyldesley / Boothstown',      tier: 'manchester_outer', region: 'greater_manchester' },
  M30: { area: 'Manchester', subArea: 'Eccles / Monton',             tier: 'manchester_outer', region: 'greater_manchester' },
  M31: { area: 'Manchester', subArea: 'Carrington / Partington',     tier: 'manchester_outer', region: 'greater_manchester' },
  M32: { area: 'Manchester', subArea: 'Stretford',                   tier: 'manchester_outer', region: 'greater_manchester' },
  M33: { area: 'Manchester', subArea: 'Sale',                        tier: 'manchester_outer', region: 'greater_manchester' },
  M34: { area: 'Manchester', subArea: 'Denton / Audenshaw',          tier: 'manchester_outer', region: 'greater_manchester' },
  M35: { area: 'Manchester', subArea: 'Failsworth',                  tier: 'manchester_outer', region: 'greater_manchester' },
  M38: { area: 'Manchester', subArea: 'Little Hulton',               tier: 'manchester_outer', region: 'greater_manchester' },
  M40: { area: 'Manchester', subArea: 'Moston / Miles Platting',     tier: 'manchester_inner', region: 'greater_manchester' },
  M41: { area: 'Manchester', subArea: 'Urmston',                     tier: 'manchester_outer', region: 'greater_manchester' },
  M43: { area: 'Manchester', subArea: 'Droylsden',                   tier: 'manchester_outer', region: 'greater_manchester' },
  M44: { area: 'Manchester', subArea: 'Irlam / Cadishead',           tier: 'manchester_outer', region: 'greater_manchester' },
  M45: { area: 'Manchester', subArea: 'Whitefield',                  tier: 'manchester_outer', region: 'greater_manchester' },
  M46: { area: 'Manchester', subArea: 'Atherton',                    tier: 'manchester_outer', region: 'greater_manchester' },
  M50: { area: 'Manchester', subArea: 'Salford Quays / MediaCityUK', tier: 'manchester_city',  region: 'greater_manchester' },
  M60: { area: 'Manchester', subArea: 'Manchester (PO Box)',          tier: 'manchester_city',  region: 'greater_manchester' },
  M61: { area: 'Manchester', subArea: 'Bolton (shared)',              tier: 'manchester_outer', region: 'greater_manchester' },
  M90: { area: 'Manchester', subArea: 'Manchester Airport',           tier: 'manchester_outer', region: 'greater_manchester' },
  M99: { area: 'Manchester', subArea: 'Manchester (PO Box)',          tier: 'manchester_city',  region: 'greater_manchester' },
};

// ─────────────────────────────────────────────────────────────
// WF — Wakefield (17 districts)
// ─────────────────────────────────────────────────────────────
const wfDistricts: Record<string, DistrictInfo> = {
  WF1:  { area: 'Wakefield', subArea: 'Wakefield City Centre',  tier: 'wakefield', region: 'yorkshire' },
  WF2:  { area: 'Wakefield', subArea: 'Wakefield / Sandal',     tier: 'wakefield', region: 'yorkshire' },
  WF3:  { area: 'Wakefield', subArea: 'Lofthouse / Tingley',    tier: 'wakefield', region: 'yorkshire' },
  WF4:  { area: 'Wakefield', subArea: 'Crofton / Horbury',      tier: 'wakefield', region: 'yorkshire' },
  WF5:  { area: 'Wakefield', subArea: 'Ossett',                 tier: 'wakefield', region: 'yorkshire' },
  WF6:  { area: 'Wakefield', subArea: 'Normanton',              tier: 'wakefield', region: 'yorkshire' },
  WF7:  { area: 'Wakefield', subArea: 'Featherstone / Ackworth',tier: 'wakefield', region: 'yorkshire' },
  WF8:  { area: 'Wakefield', subArea: 'Pontefract',             tier: 'wakefield', region: 'yorkshire' },
  WF9:  { area: 'Wakefield', subArea: 'South Elmsall / Hemsworth', tier: 'wakefield', region: 'yorkshire' },
  WF10: { area: 'Wakefield', subArea: 'Castleford',             tier: 'wakefield', region: 'yorkshire' },
  WF11: { area: 'Wakefield', subArea: 'Knottingley / Ferrybridge', tier: 'wakefield', region: 'yorkshire' },
  WF12: { area: 'Wakefield', subArea: 'Dewsbury / Thornhill',   tier: 'wakefield', region: 'yorkshire' },
  WF13: { area: 'Wakefield', subArea: 'Dewsbury / Ravensthorpe',tier: 'wakefield', region: 'yorkshire' },
  WF14: { area: 'Wakefield', subArea: 'Mirfield',               tier: 'wakefield', region: 'yorkshire' },
  WF15: { area: 'Wakefield', subArea: 'Liversedge / Cleckheaton',tier: 'wakefield', region: 'yorkshire' },
  WF16: { area: 'Wakefield', subArea: 'Heckmondwike',           tier: 'wakefield', region: 'yorkshire' },
  WF17: { area: 'Wakefield', subArea: 'Batley',                 tier: 'wakefield', region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// HD — Huddersfield (9 districts)
// ─────────────────────────────────────────────────────────────
const hdDistricts: Record<string, DistrictInfo> = {
  HD1: { area: 'Huddersfield', subArea: 'Huddersfield Town Centre', tier: 'huddersfield', region: 'yorkshire' },
  HD2: { area: 'Huddersfield', subArea: 'Huddersfield North',       tier: 'huddersfield', region: 'yorkshire' },
  HD3: { area: 'Huddersfield', subArea: 'Lindley / Salendine Nook', tier: 'huddersfield', region: 'yorkshire' },
  HD4: { area: 'Huddersfield', subArea: 'Crosland Moor / Lockwood', tier: 'huddersfield', region: 'yorkshire' },
  HD5: { area: 'Huddersfield', subArea: 'Almondbury / Dalton',      tier: 'huddersfield', region: 'yorkshire' },
  HD6: { area: 'Huddersfield', subArea: 'Brighouse',                tier: 'huddersfield', region: 'yorkshire' },
  HD7: { area: 'Huddersfield', subArea: 'Holmfirth / Meltham',      tier: 'huddersfield', region: 'yorkshire' },
  HD8: { area: 'Huddersfield', subArea: 'Kirkburton / Skelmanthorpe',tier: 'huddersfield', region: 'yorkshire' },
  HD9: { area: 'Huddersfield', subArea: 'Holmfirth / Denby Dale',   tier: 'huddersfield', region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// HX — Halifax (7 districts)
// ─────────────────────────────────────────────────────────────
const hxDistricts: Record<string, DistrictInfo> = {
  HX1: { area: 'Halifax', subArea: 'Halifax Town Centre',  tier: 'halifax', region: 'yorkshire' },
  HX2: { area: 'Halifax', subArea: 'Halifax North',        tier: 'halifax', region: 'yorkshire' },
  HX3: { area: 'Halifax', subArea: 'Northowram / Shibden', tier: 'halifax', region: 'yorkshire' },
  HX4: { area: 'Halifax', subArea: 'Greetland / Stainland',tier: 'halifax', region: 'yorkshire' },
  HX5: { area: 'Halifax', subArea: 'Elland',               tier: 'halifax', region: 'yorkshire' },
  HX6: { area: 'Halifax', subArea: 'Sowerby Bridge',       tier: 'halifax', region: 'yorkshire' },
  HX7: { area: 'Halifax', subArea: 'Hebden Bridge',        tier: 'halifax', region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// HG — Harrogate (5 districts)
// ─────────────────────────────────────────────────────────────
const hgDistricts: Record<string, DistrictInfo> = {
  HG1: { area: 'Harrogate', subArea: 'Harrogate Town Centre', tier: 'harrogate', region: 'yorkshire' },
  HG2: { area: 'Harrogate', subArea: 'Harrogate South',       tier: 'harrogate', region: 'yorkshire' },
  HG3: { area: 'Harrogate', subArea: 'Pateley Bridge / Nidderdale', tier: 'harrogate', region: 'yorkshire' },
  HG4: { area: 'Harrogate', subArea: 'Ripon',                 tier: 'harrogate', region: 'yorkshire' },
  HG5: { area: 'Harrogate', subArea: 'Knaresborough',         tier: 'harrogate', region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// YO — York (26 districts)
// ─────────────────────────────────────────────────────────────
const yoDistricts: Record<string, DistrictInfo> = {
  YO1:  { area: 'York', subArea: 'York City Centre',      tier: 'york', region: 'yorkshire' },
  YO7:  { area: 'York', subArea: 'Thirsk / Northallerton',tier: 'york', region: 'yorkshire' },
  YO8:  { area: 'York', subArea: 'Selby',                 tier: 'york', region: 'yorkshire' },
  YO10: { area: 'York', subArea: 'York Outer / Fulford',  tier: 'york', region: 'yorkshire' },
  YO11: { area: 'York', subArea: 'Scarborough',           tier: 'york', region: 'yorkshire' },
  YO12: { area: 'York', subArea: 'Scarborough North',     tier: 'york', region: 'yorkshire' },
  YO13: { area: 'York', subArea: 'Scarborough West',      tier: 'york', region: 'yorkshire' },
  YO14: { area: 'York', subArea: 'Filey',                 tier: 'york', region: 'yorkshire' },
  YO15: { area: 'York', subArea: 'Bridlington',           tier: 'york', region: 'yorkshire' },
  YO16: { area: 'York', subArea: 'Bridlington South',     tier: 'york', region: 'yorkshire' },
  YO17: { area: 'York', subArea: 'Malton / Norton',       tier: 'york', region: 'yorkshire' },
  YO18: { area: 'York', subArea: 'Pickering / Helmsley',  tier: 'york', region: 'yorkshire' },
  YO19: { area: 'York', subArea: 'Elvington / Stamford Bridge', tier: 'york', region: 'yorkshire' },
  YO21: { area: 'York', subArea: 'Whitby',                tier: 'york', region: 'yorkshire' },
  YO22: { area: 'York', subArea: 'Whitby / Robin Hood\'s Bay', tier: 'york', region: 'yorkshire' },
  YO23: { area: 'York', subArea: 'Bishopthorpe / Tadcaster', tier: 'york', region: 'yorkshire' },
  YO24: { area: 'York', subArea: 'York West / Acomb',     tier: 'york', region: 'yorkshire' },
  YO25: { area: 'York', subArea: 'Driffield / Bainton',   tier: 'york', region: 'yorkshire' },
  YO26: { area: 'York', subArea: 'York Outer / Skelton',  tier: 'york', region: 'yorkshire' },
  YO30: { area: 'York', subArea: 'York North / Skelton',  tier: 'york', region: 'yorkshire' },
  YO31: { area: 'York', subArea: 'York Heworth',          tier: 'york', region: 'yorkshire' },
  YO32: { area: 'York', subArea: 'Strensall / Huntington',tier: 'york', region: 'yorkshire' },
  YO41: { area: 'York', subArea: 'Stamford Bridge / Pocklington', tier: 'york', region: 'yorkshire' },
  YO42: { area: 'York', subArea: 'Pocklington',           tier: 'york', region: 'yorkshire' },
  YO43: { area: 'York', subArea: 'Market Weighton',       tier: 'york', region: 'yorkshire' },
  YO51: { area: 'York', subArea: 'Boroughbridge',         tier: 'york', region: 'yorkshire' },
  YO60: { area: 'York', subArea: 'Sheriff Hutton',        tier: 'york', region: 'yorkshire' },
  YO61: { area: 'York', subArea: 'Easingwold / Helperby', tier: 'york', region: 'yorkshire' },
  YO62: { area: 'York', subArea: 'Kirkbymoorside / Helmsley', tier: 'york', region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// DN — Doncaster (12 districts)
// ─────────────────────────────────────────────────────────────
const dnDistricts: Record<string, DistrictInfo> = {
  DN1:  { area: 'Doncaster', subArea: 'Doncaster Town Centre', tier: 'doncaster', region: 'yorkshire' },
  DN2:  { area: 'Doncaster', subArea: 'Doncaster East',        tier: 'doncaster', region: 'yorkshire' },
  DN3:  { area: 'Doncaster', subArea: 'Armthorpe / Edenthorpe',tier: 'doncaster', region: 'yorkshire' },
  DN4:  { area: 'Doncaster', subArea: 'Doncaster South',       tier: 'doncaster', region: 'yorkshire' },
  DN5:  { area: 'Doncaster', subArea: 'Doncaster North',       tier: 'doncaster', region: 'yorkshire' },
  DN6:  { area: 'Doncaster', subArea: 'Adwick / Askern',       tier: 'doncaster', region: 'yorkshire' },
  DN7:  { area: 'Doncaster', subArea: 'Stainforth / Hatfield', tier: 'doncaster', region: 'yorkshire' },
  DN8:  { area: 'Doncaster', subArea: 'Thorne / Moorends',     tier: 'doncaster', region: 'yorkshire' },
  DN9:  { area: 'Doncaster', subArea: 'Epworth / Isle of Axholme', tier: 'doncaster', region: 'yorkshire' },
  DN10: { area: 'Doncaster', subArea: 'Bawtry / Blyth',        tier: 'doncaster', region: 'yorkshire' },
  DN11: { area: 'Doncaster', subArea: 'Tickhill / New Rossington', tier: 'doncaster', region: 'yorkshire' },
  DN12: { area: 'Doncaster', subArea: 'Conisbrough / Denaby',  tier: 'doncaster', region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// S — Sheffield (26 districts)
// ─────────────────────────────────────────────────────────────
const sDistricts: Record<string, DistrictInfo> = {
  S1:  { area: 'Sheffield', subArea: 'Sheffield City Centre', tier: 'sheffield_city',  region: 'yorkshire' },
  S2:  { area: 'Sheffield', subArea: 'Sheffield South East',  tier: 'sheffield_city',  region: 'yorkshire' },
  S3:  { area: 'Sheffield', subArea: 'Burngreave / Burngreave', tier: 'sheffield_city', region: 'yorkshire' },
  S4:  { area: 'Sheffield', subArea: 'Burngreave',             tier: 'sheffield_city',  region: 'yorkshire' },
  S5:  { area: 'Sheffield', subArea: 'Southey / Parson Cross', tier: 'sheffield_city', region: 'yorkshire' },
  S6:  { area: 'Sheffield', subArea: 'Hillsborough / Walkley', tier: 'sheffield_city', region: 'yorkshire' },
  S7:  { area: 'Sheffield', subArea: 'Nether Edge / Sharrow',  tier: 'sheffield_city', region: 'yorkshire' },
  S8:  { area: 'Sheffield', subArea: 'Woodseats / Norton',     tier: 'sheffield_city', region: 'yorkshire' },
  S9:  { area: 'Sheffield', subArea: 'Tinsley / Attercliffe',  tier: 'sheffield_city', region: 'yorkshire' },
  S10: { area: 'Sheffield', subArea: 'Broomhill / Crookes',    tier: 'sheffield_city', region: 'yorkshire' },
  S11: { area: 'Sheffield', subArea: 'Ecclesall / Broomhill',  tier: 'sheffield_city', region: 'yorkshire' },
  S12: { area: 'Sheffield', subArea: 'Gleadless / Woodhouse',  tier: 'sheffield_outer', region: 'yorkshire' },
  S13: { area: 'Sheffield', subArea: 'Handsworth',             tier: 'sheffield_outer', region: 'yorkshire' },
  S14: { area: 'Sheffield', subArea: 'Gleadless Valley',       tier: 'sheffield_outer', region: 'yorkshire' },
  S17: { area: 'Sheffield', subArea: 'Dore / Totley',          tier: 'sheffield_outer', region: 'yorkshire' },
  S18: { area: 'Sheffield', subArea: 'Dronfield / Coal Aston', tier: 'sheffield_outer', region: 'yorkshire' },
  S20: { area: 'Sheffield', subArea: 'Halfway / Mosborough',   tier: 'sheffield_outer', region: 'yorkshire' },
  S21: { area: 'Sheffield', subArea: 'Killamarsh / Eckington', tier: 'sheffield_outer', region: 'yorkshire' },
  S25: { area: 'Sheffield', subArea: 'Laughton / Dinnington',  tier: 'sheffield_outer', region: 'yorkshire' },
  S26: { area: 'Sheffield', subArea: 'Wales / Kiveton Park',   tier: 'sheffield_outer', region: 'yorkshire' },
  S32: { area: 'Sheffield', subArea: 'Hathersage',             tier: 'sheffield_outer', region: 'yorkshire' },
  S33: { area: 'Sheffield', subArea: 'Bamford / Hope Valley',  tier: 'sheffield_outer', region: 'yorkshire' },
  S35: { area: 'Sheffield', subArea: 'Chapeltown / High Green', tier: 'sheffield_outer', region: 'yorkshire' },
  S36: { area: 'Sheffield', subArea: 'Stocksbridge / Penistone', tier: 'sheffield_outer', region: 'yorkshire' },
  S40: { area: 'Sheffield', subArea: 'Chesterfield (shared)',  tier: 'sheffield_outer', region: 'yorkshire' },
  S41: { area: 'Sheffield', subArea: 'Chesterfield (shared)',  tier: 'sheffield_outer', region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// HU — Hull (17 districts)
// ─────────────────────────────────────────────────────────────
const huDistricts: Record<string, DistrictInfo> = {
  HU1:  { area: 'Hull', subArea: 'Hull City Centre',         tier: 'hull', region: 'yorkshire' },
  HU2:  { area: 'Hull', subArea: 'Hull West / Anlaby',       tier: 'hull', region: 'yorkshire' },
  HU3:  { area: 'Hull', subArea: 'Hull West / Hessle Road',  tier: 'hull', region: 'yorkshire' },
  HU4:  { area: 'Hull', subArea: 'Hull West',                tier: 'hull', region: 'yorkshire' },
  HU5:  { area: 'Hull', subArea: 'Hull Avenues / Newland',   tier: 'hull', region: 'yorkshire' },
  HU6:  { area: 'Hull', subArea: 'Hull North / Bransholme',  tier: 'hull', region: 'yorkshire' },
  HU7:  { area: 'Hull', subArea: 'Bransholme / Sutton',      tier: 'hull', region: 'yorkshire' },
  HU8:  { area: 'Hull', subArea: 'East Hull / Southcoates',  tier: 'hull', region: 'yorkshire' },
  HU9:  { area: 'Hull', subArea: 'East Hull / Marfleet',     tier: 'hull', region: 'yorkshire' },
  HU10: { area: 'Hull', subArea: 'Kirkella / Willerby',      tier: 'hull', region: 'yorkshire' },
  HU11: { area: 'Hull', subArea: 'Skirlaugh / Bilton',       tier: 'hull', region: 'yorkshire' },
  HU12: { area: 'Hull', subArea: 'Hedon / Withernsea',       tier: 'hull', region: 'yorkshire' },
  HU13: { area: 'Hull', subArea: 'Hessle',                   tier: 'hull', region: 'yorkshire' },
  HU14: { area: 'Hull', subArea: 'South Cave / Brough',      tier: 'hull', region: 'yorkshire' },
  HU15: { area: 'Hull', subArea: 'South Cave / Brough',      tier: 'hull', region: 'yorkshire' },
  HU16: { area: 'Hull', subArea: 'Cottingham',               tier: 'hull', region: 'yorkshire' },
  HU17: { area: 'Hull', subArea: 'Beverley',                 tier: 'hull', region: 'yorkshire' },
};

// ─────────────────────────────────────────────────────────────
// Merged lookup — district code → DistrictInfo
// ─────────────────────────────────────────────────────────────
export const DISTRICT_LOOKUP: Record<string, DistrictInfo> = {
  ...lsDistricts,
  ...bdDistricts,
  ...mDistricts,
  ...wfDistricts,
  ...hdDistricts,
  ...hxDistricts,
  ...hgDistricts,
  ...yoDistricts,
  ...dnDistricts,
  ...sDistricts,
  ...huDistricts,
};

/**
 * Extracts the district code (e.g. "LS6") from a full UK postcode
 * (e.g. "LS6 1AA" → "LS6", "M1 1AE" → "M1").
 */
export function getDistrictFromPostcode(postcode: string): string {
  const cleaned = postcode.toUpperCase().replace(/\s+/g, '');
  // UK postcode format: outward code (2-4 chars) + inward code (3 chars)
  // outward code = area letters + district number(s)
  const match = cleaned.match(/^([A-Z]{1,2}\d{1,2}[A-Z]?)/);
  return match ? match[1] : '';
}

/**
 * Returns DistrictInfo for a postcode, or null if outside operating area.
 */
export function lookupPostcode(postcode: string): DistrictInfo | null {
  const district = getDistrictFromPostcode(postcode);
  return DISTRICT_LOOKUP[district] ?? null;
}

/**
 * Checks whether a postcode is within House of Lettings' operating area.
 */
export function isOperatingArea(postcode: string): boolean {
  return lookupPostcode(postcode) !== null;
}

// ─────────────────────────────────────────────────────────────
// 2026 pricing data per tier (£ / month for rent, £ for sale)
// Source: Zoopla / ONS regional data, June 2026
// ─────────────────────────────────────────────────────────────
export const TIER_PRICING_2026: Record<PricingTier, { avgSale: number; avgRent: number }> = {
  leeds_city:           { avgSale: 280_000, avgRent: 1_350 },
  leeds_inner:          { avgSale: 235_000, avgRent: 1_100 },
  leeds_outer:          { avgSale: 260_000, avgRent:   950 },
  manchester_city:      { avgSale: 310_000, avgRent: 1_500 },
  manchester_inner:     { avgSale: 255_000, avgRent: 1_200 },
  manchester_outer:     { avgSale: 225_000, avgRent:   980 },
  bradford_city:        { avgSale: 155_000, avgRent:   750 },
  bradford_outer:       { avgSale: 185_000, avgRent:   780 },
  wakefield:            { avgSale: 195_000, avgRent:   820 },
  huddersfield:         { avgSale: 200_000, avgRent:   830 },
  halifax:              { avgSale: 185_000, avgRent:   790 },
  harrogate:            { avgSale: 330_000, avgRent: 1_150 },
  york:                 { avgSale: 315_000, avgRent: 1_100 },
  sheffield_city:       { avgSale: 185_000, avgRent:   900 },
  sheffield_outer:      { avgSale: 210_000, avgRent:   830 },
  doncaster:            { avgSale: 165_000, avgRent:   750 },
  hull:                 { avgSale: 155_000, avgRent:   720 },
  yorkshire_general:    { avgSale: 200_000, avgRent:   850 },
};
