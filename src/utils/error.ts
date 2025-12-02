class CustomError extends Error {
  public statusCode: number;
  public status: string;
  public isOperational: boolean;
  constructor(msg: string, code: number) {
    super(msg)
    this.statusCode = code
    this.status = `${code}`.startsWith('4') ? 'failed' : 'error'
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor);
  }
}
export class BadRequestError extends CustomError{
  constructor(msg:string='Bad Request'){
    super(msg,400)
  }
}
export class NotFoundError extends CustomError{
  constructor(msg:string='Not Found'){
    super(msg,404)
  }
}