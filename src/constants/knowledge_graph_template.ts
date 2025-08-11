export const properties = [
  {
    name: 'venue serie',
    description: 'In which conference venue is the publication published?',
    cardinality: '1 to 1',
    id: 'C81025',
    property_id: 'P135046',
  },
  {
    name: 'research problem',
    description:
      'What is the research problem under consideration in the publication?',
    cardinality: '1 to 1',
    id: 'Problem',
    property_id: 'P32',
  },
  {
    name: 'research paradigm',
    description: 'What is the underlying research paradigm of the publication?',
    cardinality: '1 to 1',
    id: 'C29004',
    property_id: 'P57003',
  },
  {
    name: 'research question',
    description: 'What is the research question reported in the publication?',
    cardinality: '1 to *',
    id: 'C27006',
    property_id: 'P37330',
  },
  {
    name: 'research question answer',
    description:
      'How is the answer to the research question reported in the publication?',
    cardinality: '1 to 1',
    id: 'C81029',
    property_id: 'P135050',
  },
  {
    name: 'data collection',
    description:
      'What is reported about the data collection in the publication?',
    cardinality: '1 to 1',
    id: 'C27004',
    property_id: 'P56008',
  },
  {
    name: 'data analysis',
    description: 'What is reported about the data analysis in the publication?',
    cardinality: '1 to 1',
    id: 'P15124',
    property_id: 'C28004',
  },
  {
    name: 'threats to validity',
    description: 'What threats to validity are reported in a publication?',
    cardinality: '1 to 1',
    id: 'P39099',
    property_id: 'C27003',
  },
];
