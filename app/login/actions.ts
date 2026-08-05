"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/auth";

export type LoginState = { error?: string } | undefined;

export async function ownerLogin(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("owner", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/pos",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
    }
    throw error;
  }
}

export async function staffLogin(_prevState: LoginState, formData: FormData): Promise<LoginState> {
  try {
    await signIn("staff", {
      username: formData.get("username"),
      pin: formData.get("pin"),
      redirectTo: "/pos",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "PIN ไม่ถูกต้อง" };
    }
    throw error;
  }
}
