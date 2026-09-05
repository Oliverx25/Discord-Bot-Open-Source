/** Error del puerto con forma HTTP (status + code), como los errores de módulo. */
export class BotGatewayError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = "BotGatewayError";
  }
}
