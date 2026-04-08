export function validatePhone(phone) {
  const phoneRegex = /^[0-9]{8}$/;
  return phoneRegex.test(phone);
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value) {
  return value !== null && value !== undefined && String(value).trim().length > 0;
}

export function validateQuoteForm(form) {
  const errors = {};

  if (!validateRequired(form.firstName)) errors.firstName = 'Le prénom est requis';
  if (!validateRequired(form.lastName)) errors.lastName = 'Le nom est requis';
  if (!validateRequired(form.email)) errors.email = "L'email est requis";
  else if (!validateEmail(form.email)) errors.email = 'Email invalide';
  if (!validateRequired(form.phone)) errors.phone = 'Le téléphone est requis';
  else if (!validatePhone(form.phone)) errors.phone = 'Numéro invalide (8 chiffres)';
  if (!validateRequired(form.clientType)) errors.clientType = 'Le type de client est requis';
  if (!validateRequired(form.serviceType)) errors.serviceType = 'Le type de service est requis';
  if (!validateRequired(form.location)) errors.location = 'La localisation est requise';
  if (!validateRequired(form.power)) errors.power = 'La puissance est requise';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateContactForm(form) {
  const errors = {};

  if (!validateRequired(form.name)) errors.name = 'Le nom est requis';
  if (!validateRequired(form.email)) errors.email = "L'email est requis";
  else if (!validateEmail(form.email)) errors.email = 'Email invalide';
  if (!validateRequired(form.message)) errors.message = 'Le message est requis';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateClaimForm(form) {
  const errors = {};

  if (!validateRequired(form.type)) errors.type = 'Le type de réclamation est requis';
  if (!validateRequired(form.description)) errors.description = 'La description est requise';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function validateRegisterForm(form) {
  const errors = {};

  if (!validateRequired(form.firstName)) errors.firstName = 'Le prénom est requis';
  if (!validateRequired(form.lastName)) errors.lastName = 'Le nom est requis';
  if (!validateRequired(form.email)) errors.email = "L'email est requis";
  else if (!validateEmail(form.email)) errors.email = 'Email invalide';
  if (!validateRequired(form.phone)) errors.phone = 'Le téléphone est requis';
  else if (!validatePhone(form.phone)) errors.phone = 'Numéro invalide (8 chiffres)';
  if (!validateRequired(form.role)) errors.role = 'Le type de compte est requis';
  if (!validateRequired(form.password)) errors.password = 'Le mot de passe est requis';
  else if (form.password.length < 6) errors.password = 'Minimum 6 caractères';
  if (form.password !== form.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas';

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
