// Glossary data loader
// This file exports the glossary terms as a simple import

import glossaryData from '../../data/glossary.json';

export interface GlossaryTerm {
  id: string;
  term: string;
  pronunciation?: string;
  definition: string;
  shortDefinition?: string;
  category: string;
  difficulty: string;
  sources?: string[];
  relatedTermIds?: string[];
  henrysTips?: string[];
  commonMistakes?: string[];
  troubleshooting?: Array<{
    problem: string;
    solution: string;
  }>;
  alternateQuestions?: string[];
  history?: string;
  mediaPlaceholder?: string[];
  youtubeQuery?: string;
  bookRef?: string;
  bookChapter?: string;
  difficultyExplanation?: string;
  affiliateTools?: Array<{
    name: string;
    link: string;
  }>;
  widgets?: string[];
}

export const glossaryTerms: GlossaryTerm[] = glossaryData;

export const getTermById = (id: string): GlossaryTerm | undefined => {
  return glossaryTerms.find(term => term.id === id);
};

export const getTermsByCategory = (category: string): GlossaryTerm[] => {
  return glossaryTerms.filter(term => term.category === category);
};

export const getTermsByDifficulty = (difficulty: string): GlossaryTerm[] => {
  return glossaryTerms.filter(term => term.difficulty === difficulty);
};

export const searchTerms = (query: string): GlossaryTerm[] => {
  const lowerQuery = query.toLowerCase();
  return glossaryTerms.filter(term => 
    term.term.toLowerCase().includes(lowerQuery) ||
    term.definition.toLowerCase().includes(lowerQuery) ||
    (term.shortDefinition && term.shortDefinition.toLowerCase().includes(lowerQuery)) ||
    (term.alternateQuestions && term.alternateQuestions.some(q => q.toLowerCase().includes(lowerQuery)))
  );
};

export const getAllCategories = (): string[] => {
  return Array.from(new Set(glossaryTerms.map(term => term.category))).sort();
};

export const getAllDifficulties = (): string[] => {
  return ['Beginner', 'Intermediate', 'Advanced'];
};

export default glossaryTerms;
