export const provincesByCountry: Record<string, string[]> = {
  US: ["California","Texas","Florida","New York","Illinois","Pennsylvania","Ohio","Georgia","North Carolina","Michigan"],
  GB: ["England","Scotland","Wales","Northern Ireland"],
  ES: ["Andalucía","Cataluña","Madrid","Comunidad Valenciana","Galicia","Castilla y León","País Vasco","Canarias"],
  FR: ["Île-de-France","Auvergne-Rhône-Alpes","Nouvelle-Aquitaine","Occitanie","Hauts-de-France","Provence-Alpes-Côte d'Azur","Grand Est","Bretagne"],
  MZ: ["Maputo","Gaza","Inhambane","Sofala","Manica","Tete","Zambézia","Nampula","Niassa","Cabo Delgado"],
  AO: ["Luanda","Benguela","Huíla","Huambo","Malanje","Uíge","Cuanza Norte","Cuanza Sul","Namibe","Zaire"],
  BR: ["São Paulo","Rio de Janeiro","Minas Gerais","Bahia","Paraná","Rio Grande do Sul","Pernambuco","Ceará","Pará","Santa Catarina"],
  PT: ["Lisboa","Porto","Braga","Aveiro","Coimbra","Setúbal","Leiria","Faro","Santarém","Viana do Castelo"],
};

export function getProvinces(countryCode: string): string[] {
  return provincesByCountry[countryCode] || [];
}
