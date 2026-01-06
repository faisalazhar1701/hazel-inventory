//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
// Mock data disabled - fake backend calls removed
// import {
//   postFakeRegister,
//   postJwtRegister,
// } from "../../../helpers/fakebackend_helper";

// action
import {
  registerUserSuccessful,
  registerUserFailed,
  resetRegisterFlagChange,
} from "./reducer";

// initialize relavant method of both Auth
const fireBaseBackend : any = getFirebaseBackend();

// Is user register successfull then direct plot user in redux.
export const registerUser = (user : any) => async (dispatch : any) => {
  try {
    let response;

    if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
      response = fireBaseBackend.registerUser(user.email, user.password);
      // yield put(registerUserSuccessful(response));
    } else if (process.env.REACT_APP_DEFAULTAUTH === "jwt") {
      // Mock data disabled - TODO: Replace with real API call using api-client
      throw new Error("JWT register not implemented - mock data disabled");
    } else if (process.env.REACT_APP_API_URL) {
      // Mock data disabled - TODO: Replace with real API call using api-client
      throw new Error("Fake register disabled - mock data removed");
    }
  } catch (error : any) {
    dispatch(registerUserFailed(error));
  }
};

export const resetRegisterFlag = () => {
  try {
    const response = resetRegisterFlagChange();
    return response;
  } catch (error) {
    return error;
  }
};