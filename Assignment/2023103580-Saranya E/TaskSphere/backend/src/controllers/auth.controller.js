import {
  registerService,
  loginService,
} from "../services/auth.service.js";

export const registerUser = async (
  req,
  res
) => {
  try {
    const result = await registerService(
      req.body
    );

    res.status(201).json({
      success: true,
      message:
        "User registered successfully",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const loginUser = async (
  req,
  res
) => {
  try {
    const result = await loginService(
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (error) {
    console.error(error);

    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMe = async (
  req,
  res
) => {
  res.status(200).json({
    success: true,
    data: req.user,
  });
};