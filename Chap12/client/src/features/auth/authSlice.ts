import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { authApi, usersApi } from "../../api/endpoints";
import { attemptTokenRefresh } from "../../api/refresh";
import { setAccessToken } from "../../api/token";
import type { User } from "../../types";

// Reduxiin tallennetaan vain se, mitä komponenttien pitää tietää: kuka on kirjautunut,
// onko kirjautunut ja latautuuko tila. Itse access token Ei ole Reduxissa vaan api/token.ts:ssa.
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// isLoading alkaa true:na, koska sovelluksen käynnistyessä ei vielä tiedetä onko sessio voimassa
const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const login = createAsyncThunk(
  "auth/login",
  async (
    credentials: { email: string; password: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await authApi.login(
        credentials.email,
        credentials.password,
      );
      setAccessToken(response.accessToken);
      return response.user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Login failed",
      );
    }
  },
);

export const register = createAsyncThunk(
  "auth/register",
  async (
    data: { email: string; password: string; username: string },
    { rejectWithValue },
  ) => {
    try {
      const response = await authApi.register(
        data.email,
        data.password,
        data.username,
      );
      setAccessToken(response.accessToken);
      return response.user;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Registration failed",
      );
    }
  },
);

export const logout = createAsyncThunk("auth/logout", async () => {
  try {
    await authApi.logout();
  } finally {
    // paikallinen tila tyhjennetään aina, vaikka verkkopyyntö epäonnistuisi
    setAccessToken(null);
  }
});

export const logoutAll = createAsyncThunk("auth/logoutAll", async () => {
  try {
    await authApi.logoutAll();
  } finally {
    setAccessToken(null);
  }
});

// Ajetaan sovelluksen käynnistyessä: refresh httpOnly evästeen avulla ja profiilin haku.
// Käyttää samaa yhteistä refresh promisea kuin API client, joten React StrictModen
// tuplakutsu ei laukaise kahta refreshia.
export const initializeAuth = createAsyncThunk(
  "auth/initialize",
  async (_, { rejectWithValue }) => {
    try {
      const refreshed = await attemptTokenRefresh();
      if (!refreshed) {
        return rejectWithValue("No valid session");
      }
      return await usersApi.getProfile();
    } catch {
      setAccessToken(null);
      return rejectWithValue("No valid session");
    }
  },
);

const signedOut = (state: AuthState) => {
  state.user = null;
  state.isAuthenticated = false;
  state.isLoading = false;
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // API client kutsuu tätä, kun refresh epäonnistuu kesken sessiota
    sessionExpired: (state) => {
      signedOut(state);
      state.error = "Your session has expired. Please log in again.";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutAll.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(logoutAll.rejected, (state) => {
        state.user = null;
        state.isAuthenticated = false;
      })
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
      });
  },
});

export const { clearError, sessionExpired } = authSlice.actions;
export default authSlice.reducer;
