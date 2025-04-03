export type Question = {
    questionText: string;
};
  
export type PromTemplate = {
    id: string;
    name: string;
    diseaseId: string;
    questions: Question[];
};

export type QuestionResponse = {
    score: string; // Assuming score is a string in the request body
    text: string;  // The question text
}