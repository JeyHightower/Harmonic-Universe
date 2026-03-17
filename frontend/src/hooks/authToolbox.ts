import { loginUser, registerUser } from "../features/Auth/authActions";
import type { LoginRequest } from "../types/auth";
import { logoutUser } from "../features/Auth/authSlice";
import type { UserDraft } from "../types/user";
import { useAppSelector,useAppDispatch  } from "./universalToolbox";



export const useAuth = () => {
   const { user, error, isLoading } = useAppSelector((state) => state.auth);
   const dispatch = useAppDispatch();

   const register = (credentials:UserDraft) => dispatch(registerUser(credentials));
   const login = (credentials:LoginRequest) => dispatch(loginUser(credentials));
   const logout = () => dispatch(logoutUser());
   const loginDemoUser = () => login({ username: 'demo', password: 'demo123'});

   return { user, error, isLoading, login, loginDemoUser, register, logout };
};