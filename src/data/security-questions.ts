export const securityRecoveryQuestionCount = 5;

export const securityQuestionOptions = [
  { id: "favorite-food", label: "What food did you enjoy most growing up?" },
  { id: "childhood-nickname", label: "What nickname did your family use for you as a child?" },
  { id: "first-pet", label: "What was the name of your first pet?" },
  { id: "first-school", label: "What was the name of your first school?" },
  { id: "favorite-teacher", label: "What was the last name of a favorite teacher?" },
  { id: "first-job", label: "What was the name of your first workplace?" },
  { id: "childhood-street", label: "What was the street name of your childhood home?" },
  { id: "first-concert", label: "What was the first concert or event you attended?" },
  { id: "favorite-book", label: "What was the first book you remember loving?" },
  { id: "school-subject", label: "What school subject did you enjoy most?" },
] as const;

export type SecurityQuestionId = (typeof securityQuestionOptions)[number]["id"];

export const securityQuestionById = new Map(
  securityQuestionOptions.map((question) => [question.id, question]),
);
