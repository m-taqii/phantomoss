import { OutreacherStateAnnotation } from "../state";

export function ifAutoSend(state: typeof OutreacherStateAnnotation.State) {
  return state.autoSend ? "sending" : "review";
}