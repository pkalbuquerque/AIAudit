import axios from "axios";

/* O backend retorna erros em dois formatos:
   - ErrorResponse: { status, erro, timestamp }
   - Validação (400): { campo: "mensagem", ... } */
export function handleApiError(error: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return "Não foi possível conectar ao servidor. Verifique se a API está no ar.";
    }
    const data = error.response.data as Record<string, unknown> | undefined;
    if (data) {
      if (typeof data.erro === "string") return data.erro;
      if (typeof data.message === "string") return data.message;
      // mapa de erros de validação campo → mensagem
      const first = Object.values(data).find((v) => typeof v === "string");
      if (typeof first === "string") return first;
    }
    if (error.response.status === 403) return "Você não tem permissão para esta ação.";
    if (error.response.status === 401) return "Sessão expirada. Faça login novamente.";
  }
  return fallback;
}
