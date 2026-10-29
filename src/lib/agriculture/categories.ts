
export type SpecificationField = {
  name: string;
  label: string;
  type: "text" | "number" | "select" | "boolean";
  required?: boolean;
  unit?: string;
  options?: string[];
  placeholder?: string;
  min?: number;
};

export type AgriculturalSubcategory = {
  name: string;
  specifications: SpecificationField[];
};

export type AgriculturalCategory = {
  name: string;
  subcategories: AgriculturalSubcategory[];
};

const conditionOptions = [
  "New",
  "Used - Excellent",
  "Used - Good",
  "Used - Fair",
];

export const agriculturalCategories: AgriculturalCategory[] = [
  {
    name: "Farm Tools & Equipment",
    subcategories: [
      {
        name: "Wheelbarrows",
        specifications: [
          {
            name: "wheelDiameter",
            label: "Wheel diameter",
            type: "number",
            unit: "inches",
            min: 1,
            required: true,
          },
          {
            name: "trayCapacity",
            label: "Tray capacity",
            type: "number",
            unit: "litres",
            min: 1,
            required: true,
          },
          {
            name: "material",
            label: "Tray material",
            type: "select",
            options: ["Steel", "Galvanized steel", "Plastic", "Other"],
            required: true,
          },
          {
            name: "wheelType",
            label: "Wheel type",
            type: "select",
            options: ["Single wheel", "Double wheel", "Other"],
          },
          {
            name: "condition",
            label: "Condition",
            type: "select",
            options: conditionOptions,
            required: true,
          },
        ],
      },
      {
        name: "Hand Tools",
        specifications: [
          {
            name: "toolType",
            label: "Tool type",
            type: "text",
            required: true,
            placeholder: "e.g. Hoe, cutlass, rake",
          },
          {
            name: "material",
            label: "Main material",
            type: "text",
            placeholder: "e.g. Carbon steel",
          },
          {
            name: "condition",
            label: "Condition",
            type: "select",
            options: conditionOptions,
            required: true,
          },
        ],
      },
      {
        name: "Power Tools",
        specifications: [
          {
            name: "powerSource",
            label: "Power source",
            type: "select",
            options: ["Electric", "Petrol", "Diesel", "Battery", "Manual"],
            required: true,
          },
          {
            name: "powerRating",
            label: "Power rating",
            type: "text",
            placeholder: "e.g. 2 kW",
          },
          {
            name: "condition",
            label: "Condition",
            type: "select",
            options: conditionOptions,
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: "Seeds & Seedlings",
    subcategories: [
      {
        name: "Maize Seeds",
        specifications: [
          {
            name: "variety",
            label: "Maize variety",
            type: "text",
            required: true,
            placeholder: "e.g. Obatanpa",
          },
          {
            name: "seedType",
            label: "Seed type",
            type: "select",
            options: ["Certified", "Hybrid", "Open-pollinated", "Local"],
            required: true,
          },
          {
            name: "packageWeight",
            label: "Package weight",
            type: "number",
            unit: "kg",
            min: 0.01,
            required: true,
          },
          {
            name: "germinationRate",
            label: "Germination rate",
            type: "number",
            unit: "%",
            min: 0,
          },
        ],
      },
      {
        name: "Vegetable Seeds",
        specifications: [
          {
            name: "crop",
            label: "Crop",
            type: "text",
            required: true,
            placeholder: "e.g. Tomato, pepper, cabbage",
          },
          {
            name: "variety",
            label: "Variety",
            type: "text",
            required: true,
          },
          {
            name: "packageSize",
            label: "Package size",
            type: "text",
            placeholder: "e.g. 10 g or 1,000 seeds",
          },
        ],
      },
      {
        name: "Seedlings",
        specifications: [
          {
            name: "crop",
            label: "Crop",
            type: "text",
            required: true,
          },
          {
            name: "age",
            label: "Seedling age",
            type: "number",
            unit: "weeks",
            min: 0,
          },
          {
            name: "quantity",
            label: "Available quantity",
            type: "number",
            min: 1,
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: "Fertilizers & Soil Inputs",
    subcategories: [
      {
        name: "Organic Fertilizers",
        specifications: [
          {
            name: "fertilizerType",
            label: "Fertilizer type",
            type: "select",
            options: ["Compost", "Manure", "Organic pellets", "Other"],
            required: true,
          },
          {
            name: "packageWeight",
            label: "Package weight",
            type: "number",
            unit: "kg",
            min: 0.1,
            required: true,
          },
          {
            name: "organicCertification",
            label: "Certified organic",
            type: "boolean",
          },
        ],
      },
      {
        name: "NPK Fertilizers",
        specifications: [
          {
            name: "npkRatio",
            label: "NPK ratio",
            type: "text",
            required: true,
            placeholder: "e.g. 15-15-15",
          },
          {
            name: "packageWeight",
            label: "Package weight",
            type: "number",
            unit: "kg",
            min: 0.1,
            required: true,
          },
          {
            name: "manufacturer",
            label: "Manufacturer",
            type: "text",
          },
        ],
      },
      {
        name: "Soil Amendments",
        specifications: [
          {
            name: "inputType",
            label: "Input type",
            type: "text",
            required: true,
            placeholder: "e.g. Lime, gypsum",
          },
          {
            name: "packageWeight",
            label: "Package weight",
            type: "number",
            unit: "kg",
            min: 0.1,
          },
        ],
      },
    ],
  },
  {
    name: "Crop Protection",
    subcategories: [
      {
        name: "Herbicides",
        specifications: [
          {
            name: "activeIngredient",
            label: "Active ingredient",
            type: "text",
            required: true,
          },
          {
            name: "formulation",
            label: "Formulation",
            type: "text",
            placeholder: "See product label",
          },
          {
            name: "packageVolume",
            label: "Package volume",
            type: "number",
            unit: "ml",
            min: 0.1,
            required: true,
          },
          {
            name: "registrationNumber",
            label: "Regulatory registration number",
            type: "text",
          },
        ],
      },
      {
        name: "Insecticides",
        specifications: [
          {
            name: "activeIngredient",
            label: "Active ingredient",
            type: "text",
            required: true,
          },
          {
            name: "formulation",
            label: "Formulation",
            type: "text",
          },
          {
            name: "packageVolume",
            label: "Package volume",
            type: "number",
            unit: "ml",
            min: 0.1,
            required: true,
          },
          {
            name: "registrationNumber",
            label: "Regulatory registration number",
            type: "text",
          },
        ],
      },
      {
        name: "Fungicides",
        specifications: [
          {
            name: "activeIngredient",
            label: "Active ingredient",
            type: "text",
            required: true,
          },
          {
            name: "packageSize",
            label: "Package size",
            type: "text",
            required: true,
          },
          {
            name: "registrationNumber",
            label: "Regulatory registration number",
            type: "text",
          },
        ],
      },
    ],
  },
  {
    name: "Animal Feed & Livestock Supplies",
    subcategories: [
      {
        name: "Poultry Feed",
        specifications: [
          {
            name: "feedStage",
            label: "Feed stage",
            type: "select",
            options: ["Starter", "Grower", "Layer", "Finisher", "Other"],
            required: true,
          },
          {
            name: "packageWeight",
            label: "Package weight",
            type: "number",
            unit: "kg",
            min: 0.1,
            required: true,
          },
          {
            name: "brand",
            label: "Brand",
            type: "text",
          },
        ],
      },
      {
        name: "Fish Feed",
        specifications: [
          {
            name: "pelletSize",
            label: "Pellet size",
            type: "number",
            unit: "mm",
            min: 0.1,
            required: true,
          },
          {
            name: "packageWeight",
            label: "Package weight",
            type: "number",
            unit: "kg",
            min: 0.1,
            required: true,
          },
          {
            name: "fishSpecies",
            label: "Suitable fish species",
            type: "text",
            placeholder: "e.g. Tilapia, catfish",
          },
        ],
      },
      {
        name: "Livestock Supplies",
        specifications: [
          {
            name: "supplyType",
            label: "Supply type",
            type: "text",
            required: true,
            placeholder: "e.g. Feeders, drinkers",
          },
          {
            name: "material",
            label: "Material",
            type: "text",
          },
        ],
      },
    ],
  },
  {
    name: "Livestock & Poultry",
    subcategories: [
      {
        name: "Poultry",
        specifications: [
          {
            name: "birdType",
            label: "Bird type",
            type: "select",
            options: ["Broiler", "Layer", "Local chicken", "Turkey", "Duck"],
            required: true,
          },
          {
            name: "ageWeeks",
            label: "Age",
            type: "number",
            unit: "weeks",
            min: 0,
          },
          {
            name: "quantity",
            label: "Number available",
            type: "number",
            min: 1,
            required: true,
          },
          {
            name: "vaccinationStatus",
            label: "Vaccination status",
            type: "text",
          },
        ],
      },
      {
        name: "Goats & Sheep",
        specifications: [
          {
            name: "animalType",
            label: "Animal type",
            type: "select",
            options: ["Goat", "Sheep"],
            required: true,
          },
          {
            name: "sex",
            label: "Sex",
            type: "select",
            options: ["Male", "Female"],
          },
          {
            name: "ageMonths",
            label: "Age",
            type: "number",
            unit: "months",
            min: 0,
          },
          {
            name: "quantity",
            label: "Number available",
            type: "number",
            min: 1,
            required: true,
          },
        ],
      },
      {
        name: "Cattle",
        specifications: [
          {
            name: "purpose",
            label: "Purpose",
            type: "select",
            options: ["Beef", "Dairy", "Breeding", "Other"],
            required: true,
          },
          {
            name: "sex",
            label: "Sex",
            type: "select",
            options: ["Male", "Female"],
          },
          {
            name: "ageMonths",
            label: "Age",
            type: "number",
            unit: "months",
            min: 0,
          },
          {
            name: "quantity",
            label: "Number available",
            type: "number",
            min: 1,
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: "Fish & Aquaculture",
    subcategories: [
      {
        name: "Live Fish",
        specifications: [
          {
            name: "species",
            label: "Fish species",
            type: "select",
            options: ["Tilapia", "Catfish", "Other"],
            required: true,
          },
          {
            name: "averageWeight",
            label: "Average fish weight",
            type: "number",
            unit: "g",
            min: 0.1,
          },
          {
            name: "quantity",
            label: "Quantity available",
            type: "number",
            min: 1,
            required: true,
          },
        ],
      },
      {
        name: "Fish Farming Equipment",
        specifications: [
          {
            name: "equipmentType",
            label: "Equipment type",
            type: "text",
            required: true,
            placeholder: "e.g. Nets, tanks, aerators",
          },
          {
            name: "material",
            label: "Material",
            type: "text",
          },
          {
            name: "condition",
            label: "Condition",
            type: "select",
            options: conditionOptions,
          },
        ],
      },
    ],
  },
  {
    name: "Irrigation & Water Systems",
    subcategories: [
      {
        name: "Water Pumps",
        specifications: [
          {
            name: "pumpType",
            label: "Pump type",
            type: "select",
            options: ["Submersible", "Centrifugal", "Solar", "Other"],
            required: true,
          },
          {
            name: "flowRate",
            label: "Flow rate",
            type: "text",
            placeholder: "e.g. 100 litres/min",
          },
          {
            name: "powerSource",
            label: "Power source",
            type: "select",
            options: ["Electric", "Petrol", "Diesel", "Solar"],
            required: true,
          },
          {
            name: "condition",
            label: "Condition",
            type: "select",
            options: conditionOptions,
          },
        ],
      },
      {
        name: "Drip Irrigation",
        specifications: [
          {
            name: "coverageArea",
            label: "Coverage area",
            type: "number",
            unit: "m²",
            min: 1,
          },
          {
            name: "kitContents",
            label: "Kit contents",
            type: "text",
            required: true,
          },
        ],
      },
      {
        name: "Water Storage Tanks",
        specifications: [
          {
            name: "capacity",
            label: "Tank capacity",
            type: "number",
            unit: "litres",
            min: 1,
            required: true,
          },
          {
            name: "material",
            label: "Material",
            type: "select",
            options: ["Plastic", "Metal", "Concrete", "Other"],
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: "Agricultural Machinery",
    subcategories: [
      {
        name: "Tractors",
        specifications: [
          {
            name: "horsepower",
            label: "Engine horsepower",
            type: "number",
            unit: "HP",
            min: 1,
            required: true,
          },
          {
            name: "driveType",
            label: "Drive type",
            type: "select",
            options: ["2WD", "4WD"],
          },
          {
            name: "year",
            label: "Year of manufacture",
            type: "number",
            min: 1950,
          },
          {
            name: "condition",
            label: "Condition",
            type: "select",
            options: conditionOptions,
            required: true,
          },
        ],
      },
      {
        name: "Threshers",
        specifications: [
          {
            name: "powerSource",
            label: "Power source",
            type: "select",
            options: ["Electric", "Petrol", "Diesel", "Manual"],
            required: true,
          },
          {
            name: "capacity",
            label: "Processing capacity",
            type: "text",
            placeholder: "e.g. 500 kg/hour",
          },
          {
            name: "condition",
            label: "Condition",
            type: "select",
            options: conditionOptions,
            required: true,
          },
        ],
      },
    ],
  },
  {
    name: "Agricultural Services",
    subcategories: [
      {
        name: "Land Preparation",
        specifications: [
          {
            name: "serviceArea",
            label: "Service area",
            type: "text",
            required: true,
            placeholder: "e.g. Accra, Eastern Region",
          },
          {
            name: "pricingBasis",
            label: "Pricing basis",
            type: "select",
            options: ["Per acre", "Per hectare", "Per day", "Negotiable"],
          },
        ],
      },
      {
        name: "Farm Transport",
        specifications: [
          {
            name: "vehicleType",
            label: "Vehicle type",
            type: "text",
            required: true,
            placeholder: "e.g. Pickup, truck",
          },
          {
            name: "loadCapacity",
            label: "Load capacity",
            type: "text",
            placeholder: "e.g. 3 tonnes",
          },
          {
            name: "serviceArea",
            label: "Service area",
            type: "text",
          },
        ],
      },
      {
        name: "Farm Labour",
        specifications: [
          {
            name: "labourType",
            label: "Labour type",
            type: "text",
            required: true,
            placeholder: "e.g. Planting, harvesting",
          },
          {
            name: "teamSize",
            label: "Available workers",
            type: "number",
            min: 1,
          },
          {
            name: "availability",
            label: "Availability",
            type: "text",
          },
        ],
      },
    ],
  },
];

export function getAgriculturalCategory(name: string) {
  return agriculturalCategories.find((category) => category.name === name);
}

export function getAgriculturalSubcategory(
  categoryName: string,
  subcategoryName: string
) {
  return getAgriculturalCategory(categoryName)?.subcategories.find(
    (subcategory) => subcategory.name === subcategoryName
  );
}
