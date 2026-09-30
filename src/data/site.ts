/**
 * Informações oficiais da Villa Vick's (fonte: material original do cliente).
 * Preços NÃO são exibidos nesta versão do site — ficam apenas nos cardápios externos.
 */
export const SITE = {
  name: "Villa Vick's",
  tagline: ["Burger", "Pizza", "Grill"] as const,
  days: "Terça a Domingo",
  hours: "18h às 23h30",
  place: "Vila Food • Arena Jesus",
  city: "Itapecuru-Mirim",
  state: "MA",
  phoneDisplay: "(98) 98595-1895",
  phoneHref: "tel:+5598985951895",
  instagramHandle: "@villavicks",
  /** WhatsApp de cada cozinha (os mesmos da página de contato da Villa Vick's) e a mensagem que já vai escrita. */
  whatsapp: {
    burger: "5598970042921",
    pizza: "5598985951895",
    grill: "559899626156",
  },
  whatsappText: "Olá, vim pelo site. Gostaria de fazer o meu pedido 🤩",
  links: {
    burgerMenu: "https://pedido.anota.ai/loja/vicksburger?f=msa",
    pizzaMenu: "https://pedido.anota.ai/loja/vicks-pizza-1?f=msa",
    grillMenu: "https://pedido.anota.ai/loja/churrasquinho-hc-edu-garcia-1?f=msa",
    contact: "https://vicksburgercontact.my.canva.site/",
    instagram: "https://www.instagram.com/villavicks",
    maps: "https://www.google.com/maps/place/Villa+Vick's/@-3.3902309,-44.3669793,776m/data=!3m1!1e3!4m17!1m10!3m9!1s0x7f4dff69a0b1293:0x1867c8def2675c81!2sVilla+Vick's!8m2!3d-3.39034!4d-44.3648791!10e5!14m1!1BCgIgAQ!16s%2Fg%2F11z7cyv75c!3m5!1s0x7f4dff69a0b1293:0x1867c8def2675c81!8m2!3d-3.39034!4d-44.3648791!16s%2Fg%2F11z7cyv75c?entry=ttu&g_ep=EgoyMDI2MDkyMi4wIKXMDSoASAFQAw%3D%3D",
    mapsEmbed: "https://maps.google.com/maps?q=-3.39034,-44.3648791&z=16&hl=pt-BR&output=embed",
  },
} as const;

export const NAV = [
  { id: "inicio", label: "Início" },
  { id: "burger", label: "Burger" },
  { id: "pizza", label: "Pizza" },
  { id: "grill", label: "Grill" },
  { id: "ambiente", label: "Ambiente" },
  { id: "localizacao", label: "Localização" },
] as const;

export type MenuItem = {
  /** Mesmo slug da foto: public/assets/cardapio/<categoria>/<slug>.webp */
  slug: string;
  /** Nome na lista (curto, dentro do grupo). */
  name: string;
  /** Nome completo no destaque, quando o curto é ambíguo (ex.: Jantinha × Espetinho de Picanha). */
  full?: string;
  desc?: string;
};
export type MenuGroup = { name: string; note?: string; items: MenuItem[] };
export type MenuCategoryId = "burger" | "pizza" | "grill";
export type MenuCategory = {
  id: MenuCategoryId;
  label: string;
  title: string;
  headline: string;
  groups: MenuGroup[];
  notes?: string[];
  cta: string;
  href: string;
  /** Fundo da página enquanto a categoria está aberta (tons de carvão que esquentam do burger para o grill). */
  bg: string;
  accent: string;
};

/**
 * Cardápio completo, com os nomes, descrições e fotos dos cardápios do anota.ai (SEM preços).
 * O que se repete em todos os itens de um grupo (pão, massa, acompanhamentos) fica na nota do grupo.
 */
export const MENU: MenuCategory[] = [
  {
    id: "burger",
    label: "Burger",
    title: "Vick's Burger",
    headline: "Isso não é fast-food. É artesanal.",
    groups: [
      {
        name: "Burgers",
        note: "Todos no pão brioche.",
        items: [
          { slug: "costela-prime", name: "Costela Prime", desc: "Blend Vick's de 130 g, muçarela, bacon crocante, costela bovina desfiada, alface, tomate, cebola roxa e maionese de pão de alho." },
          { slug: "ogro", name: "Ogro", desc: "Blend Vick's de 130 g, muçarela, calabresa fatiada, ovo frito, batata palha artesanal, alface e tomate." },
          { slug: "brutus", name: "Brutus", desc: "Duplo blend Vick's de 130 g, duplo muçarela, duplo bacon crocante, alface e tomate." },
          { slug: "brabo", name: "Brabo", desc: "Triplo blend Vick's de 60 g, triplo muçarela, triplo bacon crocante e molho barbecue." },
          { slug: "hot", name: "Hot", desc: "Blend Vick's de 130 g, queijo coalho assado, bacon crocante, geleia de pimenta, alface e tomate." },
          { slug: "tropical", name: "Tropical", desc: "Blend Vick's de 130 g, muçarela, bacon crocante, abacaxi caramelizado no barbecue, alface e tomate." },
          { slug: "top", name: "Top", desc: "Blend Vick's de 130 g, cheddar, bacon crocante, cebola caramelizada, alface e tomate." },
          { slug: "fantastic", name: "Fantastic", desc: "Blend Vick's de 130 g, muçarela, bacon crocante, cebola crispy, alface, tomate e molho barbecue." },
          { slug: "smash", name: "Smash", desc: "Duplo smash Vick's de 60 g, duplo cheddar, picles, cebola roxa e molho especial." },
          { slug: "classico", name: "Clássico", desc: "Blend Vick's de 130 g, muçarela, bacon crocante, alface e tomate." },
          { slug: "steak", name: "Steak", desc: "Steak de frango de 130 g recheado com presunto e queijo prato, muçarela, bacon crocante, alface, tomate e maionese defumada." },
          { slug: "vegetariano", name: "Vegetariano", desc: "Duas fatias de abacaxi caramelizado no barbecue, muçarela, alface e tomate." },
          { slug: "kids", name: "Kids", desc: "Blend Vick's de 60 g, muçarela, batata palha e molho da casa (maionese da casa e ketchup de goiabada), no brioche pequeno." },
        ],
      },
      {
        name: "Dogs",
        note: "No pão brioche.",
        items: [
          { slug: "dog-fabuloso", full: "Dog Fabuloso", name: "Fabuloso", desc: "Duas salsichas, carne moída, cheddar, bacon crocante e cebola crispy." },
          { slug: "dog-tradicional", full: "Dog Tradicional", name: "Tradicional", desc: "Duas salsichas, carne moída, muçarela, milho verde, ervilha, batata palha artesanal, parmesão e cream cheese." },
          { slug: "dog-pizza", full: "Dog Pizza", name: "Dog Pizza", desc: "Duas salsichas, molho de tomate, muçarela, calabresa, milho verde, tomate, azeitona e orégano." },
          { slug: "dog-doguinho", full: "Doguinho", name: "Doguinho", desc: "Salsicha, carne moída, muçarela, milho verde e batata palha artesanal, no brioche pequeno." },
        ],
      },
      {
        name: "Porções",
        items: [
          { slug: "batata-supreme", name: "Batata Supreme", desc: "Fritas sequinhas cobertas com cream cheese, costela bovina desfiada e cebolinha, com ketchup de goiabada." },
          { slug: "batata-especial", name: "Batata Especial", desc: "Fritas sequinhas e crocantes cobertas com cheddar e bacon." },
          { slug: "batata-frita", name: "Batata Frita", desc: "Fritas sequinhas e crocantes, com ketchup de goiabada." },
          { slug: "onion-rings", name: "Onion Rings", desc: "Anéis de cebola empanados, com o molho da casa." },
          { slug: "franguito", name: "Franguito", desc: "Filezinho de frango sassami empanado na farinha panko, com o molho da casa." },
          { slug: "pastelzinho-cigarrete", name: "Pastelzinho Cigarrete", desc: "Dez pastéis cigarrete (carne, queijo coalho e calabresa) com geleia de pimenta." },
        ],
      },
    ],
    cta: "Pedir no Vick's Burger",
    href: SITE.links.burgerMenu,
    bg: "#070202",
    accent: "text-vred-text",
  },
  {
    id: "pizza",
    label: "Pizza",
    title: "Vick's Pizza",
    headline: "Massa italiana de longa fermentação.",
    groups: [
      {
        name: "Sabores",
        note: "Toda pizza leva massa italiana de longa fermentação e molho de tomate.",
        items: [
          { slug: "a-moda-vicks", name: "À Moda Vick's", desc: "Muçarela, frango desfiado, palmito, milho verde, catupiry, bacon, calabresa fatiada e orégano." },
          { slug: "nordestina", name: "Nordestina", desc: "Muçarela, carne seca, queijo coalho em cubos, cebola roxa e geleia de pimenta." },
          { slug: "portuguesa", name: "Portuguesa", desc: "Presunto, muçarela, ovo cozido, cebola roxa, pimentão, tomate, azeitona e orégano." },
          { slug: "carne-seca", name: "Carne Seca", desc: "Muçarela, carne seca desfiada, catupiry, cebola roxa, pimenta biquinho e orégano." },
          { slug: "camarao", name: "Camarão", desc: "Creme de camarão, muçarela, camarão grelhado, tomatinho cereja e cheiro-verde, com um fio de azeite extravirgem." },
          { slug: "caipira", name: "Caipira", desc: "Muçarela, frango, milho verde, cream cheese, bacon, tomate e orégano." },
          { slug: "4-queijos", name: "4 Queijos", desc: "Muçarela, parmesão, provolone, catupiry e orégano." },
          { slug: "pepperoni", name: "Pepperoni", desc: "Muçarela, pepperoni, pimenta calabresa e melaço de cana." },
          { slug: "marguerita", name: "Marguerita", desc: "Muçarela, parmesão, tomatinho cereja, manjericão e orégano." },
          { slug: "napolitana", name: "Napolitana", desc: "Muçarela, presunto, tomate, azeitona preta e orégano." },
          { slug: "havaiana", name: "Havaiana", desc: "Muçarela, lombo canadense defumado, abacaxi, molho barbecue, azeitona preta e orégano." },
          { slug: "frango", name: "Frango", desc: "Muçarela, frango desfiado, catupiry, azeitona e orégano." },
          { slug: "calabresa", name: "Calabresa", desc: "Muçarela, calabresa fatiada, cebola roxa, azeitona preta e orégano." },
          { slug: "calabresita", name: "Calabresita", desc: "Muçarela, calabresa moída, milho verde e orégano." },
          { slug: "bacon", name: "Bacon", desc: "Muçarela, bacon, tomate e orégano." },
        ],
      },
    ],
    notes: ["Pequena: 25 cm, 4 fatias", "Grande: 35 cm, 8 fatias, até 2 sabores"],
    cta: "Pedir no Vick's Pizza",
    href: SITE.links.pizzaMenu,
    bg: "#0d0906",
    accent: "text-mustard",
  },
  {
    id: "grill",
    label: "Grill",
    title: "Vick's Grill",
    headline: "Da brasa direto para a mesa.",
    groups: [
      {
        name: "Jantinhas",
        note: "Com feijão tropeiro, arroz branco ou temperado, macarronese ou salada verde, vinagrete e farofa.",
        items: [
          { slug: "jantinha-picanha", full: "Jantinha de Picanha", name: "Picanha", desc: "Picanha bovina (200 g) assada na brasa." },
          { slug: "jantinha-cupim", full: "Jantinha de Cupim Premium", name: "Cupim Premium", desc: "Cupim bovino premium (200 g) assado na brasa." },
          { slug: "jantinha-file-queijo", full: "Jantinha de Filé com Queijo", name: "Filé com Queijo", desc: "Filé bovino recheado com queijo coalho, assado na brasa." },
          { slug: "jantinha-medalhao", full: "Jantinha de Medalhão de Frango", name: "Medalhão de Frango", desc: "Filé de frango sassami envolto em fatias de bacon, assado na brasa." },
          { slug: "jantinha-mista", full: "Jantinha Mista", name: "Mista", desc: "Alcatra, frango e toscana assados na brasa." },
          { slug: "jantinha-panceta", full: "Jantinha de Panceta Suína", name: "Panceta Suína", desc: "Panceta suína (200 g) assada na brasa." },
          { slug: "jantinha-coxinha-asa", full: "Jantinha de Coxinha e Asa", name: "Coxinha e Asa", desc: "Dois pares de coxinha e asa de frango assados na brasa." },
          { slug: "jantinha-frango", full: "Jantinha de Frango", name: "Frango", desc: "Filé de frango sassami (200 g) assado na brasa." },
        ],
      },
      {
        name: "Espetinhos",
        note: "Com vinagrete e farofa.",
        items: [
          { slug: "espetinho-picanha", full: "Espetinho de Picanha", name: "Picanha", desc: "Picanha bovina (200 g)." },
          { slug: "espetinho-cupim", full: "Espetinho de Cupim Premium", name: "Cupim Premium", desc: "Cupim bovino premium (200 g)." },
          { slug: "espetinho-file-queijo", full: "Espetinho de Filé com Queijo", name: "Filé com Queijo", desc: "Filé bovino recheado com queijo coalho." },
          { slug: "espetinho-medalhao", full: "Espetinho de Medalhão de Frango", name: "Medalhão de Frango", desc: "Filé de frango sassami envolto em fatias de bacon." },
          { slug: "espetinho-misto", full: "Espetinho Misto", name: "Misto", desc: "Alcatra, frango e toscana." },
          { slug: "espetinho-panceta", full: "Espetinho de Panceta Suína", name: "Panceta Suína", desc: "Panceta suína (200 g)." },
          { slug: "espetinho-coxinha-asa", full: "Espetinho de Coxinha e Asa", name: "Coxinha e Asa", desc: "Dois pares de coxinha e asa de frango." },
          { slug: "espetinho-frango", full: "Espetinho de Frango", name: "Frango", desc: "Filé de frango sassami (200 g)." },
        ],
      },
      {
        name: "Porções",
        note: "Com vinagrete e farofa.",
        items: [
          { slug: "carne-de-sol-picanha", name: "Carne de Sol de Picanha", desc: "Carne de sol de picanha (350 g) com macaxeira." },
          { slug: "file-com-fritas", name: "Filé com Fritas", desc: "Filé bovino (350 g) com batata frita." },
          { slug: "porcao-mista", name: "Porção Mista", desc: "Filé bovino (200 g), calabresa (200 g), batata frita (200 g) e três onion rings." },
          { slug: "calabresa-com-fritas", name: "Calabresa com Fritas", desc: "Calabresa acebolada (300 g) com batata frita." },
          { slug: "torresmo", name: "Torresmo", desc: "Torresmo crocante (200 g)." },
        ],
      },
      {
        name: "Acompanhamentos",
        note: "Também vendidos à parte.",
        items: [
          { slug: "feijao-tropeiro", name: "Feijão Tropeiro" },
          { slug: "arroz-temperado", name: "Arroz Temperado" },
          { slug: "arroz-branco", name: "Arroz Branco" },
          { slug: "macarronese", name: "Macarronese" },
          { slug: "salada-verde", name: "Salada Verde" },
          { slug: "farofa", name: "Farofa" },
          { slug: "vinagrete", name: "Vinagrete" },
        ],
      },
    ],
    cta: "Pedir no Vick's Grill",
    href: SITE.links.grillMenu,
    bg: "#110804",
    accent: "text-ember",
  },
];

/** Todos os produtos em sequência (Burger → Pizza → Grill), na ordem em que aparecem no site. */
export const MENU_ITEMS = MENU.flatMap((c) =>
  c.groups.flatMap((g) => g.items.map((item) => ({ ...item, title: item.full ?? item.name, category: c.id, group: g.name, note: g.note, key: `${c.id}/${item.slug}` }))),
);
export type FlatMenuItem = (typeof MENU_ITEMS)[number];

export const external = { target: "_blank", rel: "noopener noreferrer" } as const;
