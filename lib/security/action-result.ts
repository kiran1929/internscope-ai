export type ActionSuccess<T> = { success: true; data: T };
export type ActionFailure = {
  success: false;
  error: { code: string; message: string };
};

export type ActionResult<T> = ActionSuccess<T> | ActionFailure;

export function actionSuccess<T>(data: T): ActionSuccess<T> {
  return { success: true, data };
}

export function actionFailure(code: string, message: string): ActionFailure {
  return { success: false, error: { code, message } };
}
