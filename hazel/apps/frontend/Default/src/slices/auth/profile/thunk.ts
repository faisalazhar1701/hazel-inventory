//Include Both Helper File with needed methods
import { getFirebaseBackend } from "../../../helpers/firebase_helper";
// Mock data disabled - fake backend calls removed
// import { postFakeProfile, postJwtProfile } from "../../../helpers/fakebackend_helper";

// action
import { profileSuccess, profileError, resetProfileFlagChange } from "./reducer";

const fireBaseBackend : any = getFirebaseBackend();

export const editProfile = (user : any) => async (dispatch : any) => {
    try {
        let response;

        if (process.env.REACT_APP_DEFAULTAUTH === "firebase") {
            response = fireBaseBackend.editProfileAPI(
                user.first_name,
                user.idx
            );

        } else if (process.env.REACT_APP_DEFAULTAUTH === "jwt") {
            // Mock data disabled - TODO: Replace with real API call using api-client
            throw new Error("JWT profile update not implemented - mock data disabled");
        } else if (process.env.REACT_APP_DEFAULTAUTH === "fake") {
            // Mock data disabled - TODO: Replace with real API call using api-client
            throw new Error("Fake profile update disabled - mock data removed");
        }

        const data = await response;

        if (data) {
            dispatch(profileSuccess(data));
        }

    } catch (error) {
        dispatch(profileError(error));
    }
};

export const resetProfileFlag = () => {
    try {
        const response = resetProfileFlagChange();
        return response;
    } catch (error) {
        return error;
    }
};