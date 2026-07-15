import api from "./api";

// Service utilise par DocumentsPage pour centraliser les appels a l'API documents.
export const getDocuments = async () => {
  const response = await api.get("/documents");
  return response.data;
};

// Le fichier et ses metadonnees sont envoyes en multipart via FormData.
export const uploadDocument = async (formData) => {
  const response = await api.post("/documents", formData);
  return response.data;
};

// Met a jour les metadonnees sans renvoyer le fichier PDF.
export const updateDocument = async (documentId, payload) => {
  const response = await api.put(`/documents/${documentId}`, payload);
  return response.data;
};

// Demande la suppression du fichier et de son enregistrement Doctrine.
export const deleteDocument = async (documentId) => {
  const response = await api.delete(`/documents/${documentId}`);
  return response.data;
};
