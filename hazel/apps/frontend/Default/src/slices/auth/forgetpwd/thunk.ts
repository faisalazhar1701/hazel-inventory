import { userForgetPasswordSuccess, userForgetPasswordError } from "./reducer"

//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";

// Mock data disabled - fake backend calls removed
// import {
//   postFakeForgetPwd,
//   postJwtForgetPwd,
// } from "../../../helpers/fakebackend_helper";

const fireBaseBackend : any= getFirebaseBackend();

export const userForgetPassword = (user : any, history : any) => async (dispatch : any) => {
  try {
      let response;
      if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {

          response = fireBaseBackend.forgetPassword(
              user.email
          )

      } else if (process.env.REACT_APP_DEFAULTAUTH === "jwt") {
          // Mock data disabled - TODO: Replace with real API call using api-client
          throw new Error("JWT forget password not implemented - mock data disabled");
      } else {
          // Mock data disabled - TODO: Replace with real API call using api-client
          throw new Error("Fake forget password disabled - mock data removed");
      }

      const data = await response;

      if (data) {
          dispatch(userForgetPasswordSuccess(
              "Reset link are sended to your mailbox, check there first"
          ))
      }
  } catch (forgetError) {
      dispatch(userForgetPasswordError(forgetError))
  }
}