import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "./index";

// Tyypitetyt hookit, jotta komponenteissa ei tarvitse importoida RootStatea joka paikassa
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
