import api from "./api";

export const templateService = {
  async getTemplates(category = null) {
    const url = category ? `/templates?category=${category}` : "/templates";
    const response = await api.get(url);
    return response.data;
  },

  async getTemplate(templateId) {
    const response = await api.get(`/templates/${templateId}`);
    return response.data;
  },

  async createTemplate(templateData) {
    const response = await api.post("/templates", templateData);
    return response.data;
  },

  async updateTemplate(templateId, templateData) {
    const response = await api.put(`/templates/${templateId}`, templateData);
    return response.data;
  },

  async deleteTemplate(templateId) {
    const response = await api.delete(`/templates/${templateId}`);
    return response.data;
  },

  async getCategories() {
    const response = await api.get("/templates/categories");
    return response.data;
  },

  async createUniverseFromTemplate(templateId, universeData) {
    const response = await api.post(
      `/templates/${templateId}/create-universe`,
      universeData,
    );
    return response.data;
  },
};
