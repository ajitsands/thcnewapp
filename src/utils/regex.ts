export const AMOUNT_CHECKER_REGEX = /^(?!0\d)\d*(\.?\d{0,2})?$/;
export const NO_SPECIAL_REGEX = /^[a-zA-Z0-9 ]*$/;
export const USERNAME_CHECK_REGEX =
  /^(?!.*--)(?!.*\.\.)(?!.*-\.)(?!.*\.-)[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/;
export const IS_URL_REGEX =
  /^(https?:\/\/)?([a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+)(:[0-9]{1,5})?(\/.*)?$/;
