export type Question = {
    questionText: string;
};
  
export type PromTemplate = {
    id: string;
    name: string;
    diseaseId: string;
    questions: Question[];
};