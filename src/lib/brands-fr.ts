import type { BrandGuide } from './brands';

// French version of the brand guides in `brands.ts` (same facts, same order).

type BrandGuideText = Pick<BrandGuide, 'tagline' | 'description' | 'highlights' | 'topModels' | 'comparison' | 'faq'>;
export type BrandPageFr = { title: string; description: string; brand: BrandGuideText };

const kz: BrandPageFr = {
  title: 'KZ Tunisie – IEM et écouteurs intra-auriculaires KZ | Level Up TN',
  description:
    'Achetez des IEM KZ authentiques en Tunisie. KZ ZS10 Pro, KZ ZSN Pro, KZ EDX Pro et plus — livraison gratuite partout en Tunisie en 24–48h. KZ Tunisie chez Level Up TN.',
  brand: {
    tagline: 'Knowledge Zenith — les IEM abordables de référence, disponibles en Tunisie',
    description: [
      "KZ (Knowledge Zenith) est l'une des marques d'IEM les plus populaires au monde, réputée pour offrir une qualité sonore exceptionnelle à petit prix. Fondée en Chine, KZ est devenue la marque de référence des audiophiles qui veulent des performances haut de gamme sans se ruiner.",
      "Chez Level Up TN, nous proposons une sélection d'écouteurs intra-auriculaires KZ livrés dans toute la Tunisie — de Tunis et Sfax à Sousse et au-delà. Que ce soit votre premier IEM ou que vous soyez un audiophile confirmé, KZ a un modèle pour vous.",
      "Les IEM KZ sont très appréciés des mélomanes, des gamers et des professionnels tunisiens qui ont besoin d'un son fiable et haute fidélité à budget maîtrisé. Tous les produits sont 100 % authentiques et couverts par la garantie.",
    ],
    highlights: [
      { title: 'Un rapport qualité-prix exceptionnel', desc: "Les IEM KZ surpassent régulièrement des écouteurs 2 à 3 fois plus chers : le meilleur choix audiophile à petit budget en Tunisie." },
      { title: 'Plusieurs configurations de transducteurs', desc: "Du simple transducteur dynamique aux hybrides DD+BA+EST — KZ couvre toutes les signatures sonores." },
      { title: 'Câbles détachables 2 broches', desc: "La plupart des modèles KZ utilisent un connecteur 2 broches 0,75 mm ou 0,78 mm : changer de câble est simple et peu coûteux." },
      { title: 'Scène sonore large et détails précis', desc: "Les IEM KZ ont une signature en V, vivante, idéale pour le gaming, la pop, le hip-hop et la musique électronique." },
      { title: '100 % authentique chez Level Up TN', desc: "Nous ne vendons que des produits KZ authentiques et vérifiés. Ni contrefaçons, ni clones — c'est garanti." },
    ],
    topModels: [
      { name: 'KZ ZS10 Pro X', badge: 'Meilleure vente', desc: "Une version améliorée de la légendaire série ZS10 : réglage revu, basses mieux maîtrisées et aigus affinés pour un son plus équilibré.", tags: ['4BA + 1DD', 'Hybride', 'Réglage amélioré', 'Câble détachable'], price: 149 },
      { name: 'KZ ZSN Pro 2', badge: 'Coup de cœur', desc: "Une évolution aboutie de la gamme ZSN : plus de clarté, un meilleur équilibre entre transducteurs et une signature plus naturelle pour l'écoute au quotidien.", tags: ['1DD + 1BA', 'Hybride', 'Son équilibré', 'Version améliorée'], price: 125 },
      { name: 'KZ ZSN Pro X', badge: 'Meilleur rapport qualité-prix', desc: "Un IEM hybride très populaire, connu pour ses basses percutantes et son énergique en V. Un excellent choix pour débuter et pour l'écoute détente.", tags: ['1DD + 1BA', 'Signature en V', 'Basses renforcées', "Entrée de gamme"], price: 90 },
    ],
    comparison: {
      headers: ['Modèle', 'Transducteurs', 'Signature sonore', 'Idéal pour', 'Prix (TND)'],
      rows: [
        ['KZ EDX Pro', '1 DD', 'Chaleureux / Basses', 'Débutants, écoute détente', '65+'],
        ['KZ ZSN Pro X', '1 DD + 1 BA', 'En V', 'Pop, hip-hop, gaming', '90+'],
        ['KZ ZS10 Pro X', '4 BA + 1 DD', 'En V / Détaillé', 'Passionnés de musique, gaming', '149+'],
        ['KZ ZEX Pro', '1 DD + 1 BA + 1 EST', 'Net / Équilibré', "Audiophiles, classique, amateurs d'aigus", ''],
        ['KZ PR2', '1 planaire', 'Neutre / Analytique', 'Mixage, monitoring, amateurs de détails', ''],
      ],
    },
    faq: [
      { q: 'Les IEM KZ sont-ils de bonne qualité ?', a: "Oui — les IEM KZ offrent régulièrement plus que ce que leur prix laisse attendre. Des modèles comme le ZS10 Pro et le ZEX Pro sont salués par les testeurs audiophiles du monde entier. Ils offrent d'excellents détails, une scène sonore large et une bonne qualité de fabrication pour le prix." },
      { q: 'Les IEM KZ sont-ils bons pour le gaming ?', a: "Absolument. La signature en V de KZ, avec des basses et des aigus mis en avant, est idéale pour le jeu. La scène sonore large aide à localiser les sons, et la restitution des détails permet d'entendre facilement les bruits de pas et l'environnement." },
      { q: 'Les IEM KZ conviennent-ils à la scène et au monitoring ?', a: "Les IEM KZ peuvent servir de retours de scène, surtout les modèles au réglage plus neutre comme le PR2. Pour un monitoring professionnel, un IEM plus neutre (Moondrop ou 7Hz) peut toutefois être préférable. KZ excelle surtout pour l'écoute loisir et passionnée." },
      { q: 'Livrez-vous les IEM KZ en Tunisie ?', a: "Oui ! Level Up TN livre les IEM KZ dans toutes les villes de Tunisie : Tunis, Sfax, Sousse, Monastir, Bizerte, Gabès et au-delà. La livraison prend 24 à 48 heures et elle est entièrement gratuite." },
      { q: 'Les IEM KZ vendus chez Level Up TN sont-ils authentiques ?', a: "Oui, à 100 %. Nous nous approvisionnons directement auprès de distributeurs agréés. Chaque produit KZ vendu chez Level Up TN est authentique et livré avec son emballage et ses accessoires d'origine." },
      { q: 'Quel IEM KZ choisir pour débuter en Tunisie ?', a: "Nous recommandons le KZ EDX Pro pour commencer : un excellent son, un port confortable et un prix très accessible. Pour monter en gamme, le KZ ZS10 Pro est un modèle polyvalent légendaire qui convient à presque tous les genres musicaux." },
    ],
  },
};

const sevenHz: BrandPageFr = {
  title: '7Hz Tunisie – IEM et écouteurs intra-auriculaires 7Hz | Level Up TN',
  description:
    'Achetez des IEM 7Hz authentiques en Tunisie. 7Hz Timeless, Salnotes Dioko, Salnotes Zero — livraison gratuite partout en Tunisie en 24–48h. 7Hz Tunisie chez Level Up TN.',
  brand: {
    tagline: 'La précision planaire. Des performances audiophiles. Livré partout en Tunisie.',
    description: [
      "7Hz est une marque audio chinoise en pleine ascension qui a conquis le monde audiophile avec ses IEM à diaphragme plat (planaires). Connus pour leurs infra-basses profondes, leurs transitoires ultra-rapides et leurs performances techniques exceptionnelles, les IEM 7Hz sont conçus pour ceux qui exigent le meilleur en résolution et en maîtrise.",
      "Le 7Hz Timeless, sorti en 2021, a fait l'effet d'une onde de choc dans la communauté audiophile : des performances planaires dignes d'IEM cinq fois plus chers. Depuis, 7Hz continue d'innover avec le Dioko et le Salnotes Zero, plus accessibles sans compromis sur la qualité.",
      "Level Up TN est fier de proposer les IEM 7Hz avec livraison gratuite dans toute la Tunisie. Musicien, ingénieur du son ou passionné : 7Hz met la magie du planaire à votre portée, à des prix accessibles.",
    ],
    highlights: [
      { title: 'Transducteurs planaires magnétiques', desc: "7Hz utilise la technologie planaire à diaphragme plat pour une réponse transitoire ultra-rapide, des infra-basses profondes et une restitution des détails d'une grande finesse." },
      { title: 'Excellence technique', desc: "Les IEM planaires excellent en superposition, en séparation et en image stéréo : chaque instrument d'un mix s'entend avec une précision chirurgicale." },
      { title: 'Infra-basses étendues', desc: "Contrairement aux transducteurs dynamiques classiques, les planaires descendent dans les fréquences les plus basses sans distorsion : des basses que l'on ressent autant qu'on les entend." },
      { title: 'Une précision de studio', desc: "Les IEM 7Hz sont appréciés des ingénieurs du son et des producteurs pour le mixage et le mastering, grâce à leur réponse en fréquence plate et maîtrisée." },
      { title: 'Matériaux haut de gamme', desc: "Boîtiers en aluminium usiné CNC et coques en résine de qualité médicale : les IEM 7Hz sont aussi beaux que durables." },
    ],
    topModels: [
      { name: '7Hz x Crinacle Zero: 2', badge: 'Meilleur petit budget', desc: "Un IEM né d'une collaboration, réglé pour un son doux et naturel, avec de meilleures basses et un meilleur équilibre général que le Zero d'origine. Un excellent premier IEM audiophile.", tags: ['1 DD', 'Neutre chaleureux', 'Roi du petit budget', 'Réglage Crinacle'], price: 159 },
    ],
    comparison: {
      headers: ['Modèle', 'Type de transducteur', 'Signature sonore', 'Idéal pour', 'Prix (TND)'],
      rows: [
        ['7Hz Salnotes Zero', 'Transducteur dynamique', 'Neutre / Équilibré', 'Écoute détente, amateurs de neutralité', ''],
        ['7Hz Salnotes Dioko', 'Planaire 13,2 mm', 'Neutre chaleureux', 'Gaming, premier planaire, usage polyvalent', ''],
        ['7Hz Timeless', 'Planaire 14,2 mm', 'Technique / Neutre', 'Audiophiles, studio, mixage', ''],
        ['7Hz Timeless AE', 'Planaire 14,2 mm+', 'Raffiné / Doux', 'Écoute haut de gamme, référence', ''],
      ],
    },
    faq: [
      { q: 'Les IEM 7Hz sont-ils bons ?', a: "7Hz est l'une des marques d'IEM les plus respectées des audiophiles dans le monde. Ses IEM planaires — le Timeless en particulier — ont remporté de nombreuses récompenses et sont souvent recommandés par des testeurs reconnus comme Resolve, Crinacle et DMS. En performances techniques et en restitution des détails, 7Hz est remarquable." },
      { q: 'Les IEM 7Hz sont-ils bons pour le gaming ?', a: "Oui, surtout le Salnotes Dioko. Les IEM planaires offrent une image stéréo et une scène sonore exceptionnelles, ce qui se traduit par une localisation très précise en jeu. Vous entendrez les pas, les tirs et l'environnement avec une précision que la plupart des IEM dynamiques n'atteignent pas." },
      { q: 'Les IEM 7Hz conviennent-ils à la scène et au monitoring ?', a: "Oui — les planaires 7Hz sont excellents pour les retours de scène et le travail en studio. Leur réponse en fréquence plate et leur son maîtrisé en font un outil idéal pour les professionnels qui ont besoin d'une écoute de référence fidèle. Le Timeless, en particulier, est utilisé par de nombreux musiciens et producteurs." },
      { q: 'Livrez-vous les IEM 7Hz en Tunisie ?', a: "Oui ! Level Up TN livre les IEM 7Hz dans toutes les villes de Tunisie : Tunis, Sfax, Sousse, Monastir, Bizerte, Gabès et plus encore. La livraison prend 24 à 48 heures et elle est entièrement gratuite." },
      { q: "Qu'est-ce qu'un IEM planaire magnétique, et est-ce mieux ?", a: "Un IEM planaire magnétique utilise un diaphragme plat et fin, parcouru de pistes conductrices et entraîné par des aimants de chaque côté. Cette conception offre une réponse plus rapide, des infra-basses plus profondes et moins de distorsion qu'un transducteur dynamique classique. Pour les détails et les performances techniques, les planaires sont généralement supérieurs — mais ils demandent souvent plus de puissance." },
      { q: 'Par quel IEM 7Hz commencer ?', a: "Si vous découvrez les IEM planaires, commencez par le Salnotes Dioko : des performances techniques de planaire à un prix accessible, avec un réglage chaleureux et tolérant. Si vous voulez aller plus loin, le Timeless est un modèle de classe mondiale qui impressionne même les audiophiles expérimentés." },
    ],
  },
};

const moondrop: BrandPageFr = {
  title: 'Moondrop Tunisie – IEM et écouteurs intra-auriculaires Moondrop | Level Up TN',
  description:
    'Achetez des IEM Moondrop authentiques en Tunisie. Moondrop Aria, Starfield, Blessing 3, Variations — livraison gratuite partout en Tunisie en 24–48h. Moondrop Tunisie chez Level Up TN.',
  brand: {
    tagline: 'Un réglage de référence. La courbe Harman maîtrisée. Disponible en Tunisie.',
    description: [
      "Moondrop est une marque chinoise d'IEM audiophiles qui a conquis des passionnés dans le monde entier grâce à ses signatures sonores soigneusement réglées sur la courbe Harman. Fondée en 2015, Moondrop est vite devenue une référence dans la communauté audiophile, avec des produits salués pour leurs performances techniques et leur tonalité naturelle.",
      "Les IEM Moondrop sont le choix des musiciens professionnels, des créateurs de contenu, des ingénieurs du son et des mélomanes exigeants en Tunisie. Leur philosophie de réglage vise la fidélité de référence : des instruments et des voix aussi naturels et vivants que possible.",
      "Level Up TN apporte la gamme Moondrop aux audiophiles tunisiens. Du SSP d'entrée de gamme aux Blessing 3 et Variations haut de gamme, nous avons l'IEM Moondrop adapté à chaque budget et à chaque usage — avec livraison gratuite partout en Tunisie.",
    ],
    highlights: [
      { title: 'Réglage sur la courbe Harman', desc: "Moondrop prend pour référence la courbe Harman intra-auriculaire, validée scientifiquement : des IEM justes et naturels, appréciés des puristes." },
      { title: 'Fabrication haut de gamme', desc: "Coques en alliage de zinc ou corps en résine : les IEM Moondrop sont faits pour durer, avec une finition digne d'IEM bien plus chers." },
      { title: 'Idéal pour le mixage et le monitoring', desc: "La réponse en fréquence plate et neutre des IEM Moondrop en fait d'excellents outils pour le studio, le podcast et la création de contenu." },
      { title: 'Esthétique anime', desc: "Moondrop associe des performances audiophiles à des illustrations inspirées de l'anime sur ses emballages et accessoires — une marque avec une vraie personnalité." },
      { title: 'Une large gamme de prix', desc: "Moondrop couvre l'entrée de gamme (SSP, Quarks), le milieu de gamme (Aria, Starfield) et le haut de gamme (Blessing 3, Variations, S8)." },
    ],
    topModels: [
      { name: 'Moondrop Aria', badge: 'Le plus populaire', desc: "La référence du milieu de gamme. L'Aria utilise un transducteur dynamique LCP unique, réglé sur la courbe Harman. Doux, détaillé et confortable pendant des heures.", tags: ['1 DD', 'Réglage Harman', 'Confort longue durée', 'Prêt pour le studio'], price: 189 },
      { name: 'Moondrop Starfield', badge: 'Favori des fans', desc: "Un superbe boîtier en fibre de carbone abritant un transducteur dynamique à nanotubes de carbone. Le Starfield propose une version légèrement plus chaleureuse du son Moondrop, avec une esthétique à couper le souffle.", tags: ['DD carbone', 'Neutre chaleureux', 'Finition premium', 'Musique et gaming'], price: 229 },
      { name: 'Moondrop Blessing 3', badge: 'Haut de gamme', desc: "L'IEM tribride haut de gamme de Moondrop : 1 DD + 4 BA + 1 transducteur planaire. Une clarté et une extension de référence sur tout le spectre.", tags: ['Tribride', '6 transducteurs', 'Référence', 'Audiophile'], price: 799 },
    ],
    comparison: {
      headers: ['Modèle', 'Transducteurs', 'Signature sonore', 'Idéal pour', 'Prix (TND)'],
      rows: [
        ['Moondrop Quarks DSP', '1 DD + DSP', 'Équilibré / Neutre', 'Utilisateurs USB-C, débutants', '89+'],
        ['Moondrop SSP', '1 DD', 'Neutre brillant', "Amateurs d'aigus et de détails", '129+'],
        ['Moondrop Aria', '1 DD (LCP)', 'Neutre Harman', 'Écoute prolongée, studio', '189+'],
        ['Moondrop Starfield', '1 DD (CNT)', 'Neutre chaleureux', 'Musique, gaming, esthétique', '229+'],
        ['Moondrop Kato', '1 DD (Ultra)', 'Naturel / Détaillé', 'Audiophiles exigeants', '399+'],
        ['Moondrop Blessing 3', '1DD+4BA+1 planaire', 'Référence', 'Haut de gamme, studio, mastering', '799+'],
      ],
    },
    faq: [
      { q: 'Les IEM Moondrop sont-ils bons ?', a: "Moondrop est largement considérée comme l'une des meilleures marques d'IEM au monde. Son attachement à la courbe Harman et à une fabrication soignée lui a valu d'innombrables récompenses et une communauté fidèle. Pour un son neutre, de référence, Moondrop est la première recommandation à chaque niveau de prix." },
      { q: 'Les IEM Moondrop sont-ils bons pour le gaming ?', a: "Les IEM Moondrop conviennent au jeu, surtout si vous préférez une localisation précise à un son chargé en basses. Des modèles comme l'Aria offrent une excellente image stéréo et une belle scène sonore. Si vous jouez avant tout et voulez plus d'impact dans les basses, un IEM en V comme un KZ ou le 7Hz Salnotes Dioko vous conviendra peut-être mieux." },
      { q: 'Les IEM Moondrop conviennent-ils à la scène et au monitoring professionnel ?', a: "Oui — c'est là que Moondrop excelle. La réponse plate, réglée sur la courbe Harman, rend les IEM Moondrop excellents pour les retours de scène, l'enregistrement en studio, le mixage et le mastering. Musiciens et ingénieurs du son choisissent régulièrement Moondrop pour un usage professionnel." },
      { q: 'Livrez-vous les IEM Moondrop en Tunisie ?', a: "Absolument. Level Up TN livre les IEM Moondrop dans toutes les villes de Tunisie — Tunis, Sfax, Sousse, Monastir, Bizerte, Gabès, Gafsa et partout ailleurs. La livraison prend 24 à 48 heures et elle est entièrement gratuite." },
      { q: "Qu'est-ce que le réglage Harman, et pourquoi est-ce important ?", a: "La courbe Harman est une courbe de réponse en fréquence issue de recherches scientifiques, que la majorité des auditeurs préfèrent pour les écouteurs intra-auriculaires. Les IEM réglés sur cette courbe sonnent de façon naturelle, équilibrée et juste, quel que soit le genre musical. Moondrop la suit de près : c'est pourquoi ses IEM sont appréciés des audiophiles et des professionnels du monde entier." },
      { q: 'Quel IEM Moondrop acheter en premier ?', a: "Pour la plupart des acheteurs tunisiens, nous recommandons de commencer par le Moondrop Aria. Il offre un son de référence à un prix milieu de gamme, il est très confortable et convient parfaitement à la musique, aux podcasts, aux films et au jeu occasionnel. Si le budget le permet, le Starfield est aussi un excellent modèle polyvalent, au look superbe." },
    ],
  },
};

export const BRAND_PAGES_FR: Record<string, BrandPageFr> = { kz, '7hz': sevenHz, moondrop };

/** Fixed wording of the brand page template. `{{brand}}` is replaced with the brand name. */
export const BRAND_UI = {
  en: {
    eyebrow: 'Brand guide',
    shop: 'Shop {{brand}}',
    about: '{{brand}} in Tunisia',
    products_title: 'Shop {{brand}} in Tunisia',
    products_sub: 'All {{brand}} products available for delivery across Tunisia. Free shipping included.',
    empty: 'No {{brand}} products listed yet —',
    empty_link: 'check the full shop',
    view_all: 'View all {{brand}} products',
    top_models: 'Top {{brand}} models',
    comparison: '{{brand}} model comparison',
    faq: 'Common questions',
  },
  fr: {
    eyebrow: 'Guide de la marque',
    shop: 'Acheter {{brand}}',
    about: '{{brand}} en Tunisie',
    products_title: 'Acheter {{brand}} en Tunisie',
    products_sub: 'Tous les produits {{brand}} livrés partout en Tunisie. Livraison gratuite incluse.',
    empty: "Aucun produit {{brand}} pour l'instant —",
    empty_link: 'voir toute la boutique',
    view_all: 'Voir tous les produits {{brand}}',
    top_models: 'Les meilleurs modèles {{brand}}',
    comparison: 'Comparatif des modèles {{brand}}',
    faq: 'Questions fréquentes',
  },
} as const;
