/**
 * Document extraction prompts for Claude - bilingual EN/ES
 */

const EXTRACTION_PROMPTS = {
  invoice: {
    en: `You are an expert invoice processor. Extract all relevant financial and vendor information from this invoice.

Required fields:
- invoice_number
- invoice_date
- due_date
- vendor_name
- vendor_email
- vendor_phone
- vendor_address
- customer_name
- customer_email
- customer_address
- line_items (array of {description, quantity, unit_price, total})
- subtotal
- tax_amount
- total_amount
- payment_terms
- notes

Return ONLY valid JSON with all found fields. Use null for missing values.`,

    es: `Eres un experto en procesamiento de facturas. Extrae toda la información financiera y del proveedor de esta factura.

Campos requeridos:
- invoice_number
- invoice_date
- due_date
- vendor_name
- vendor_email
- vendor_phone
- vendor_address
- customer_name
- customer_email
- customer_address
- line_items (array of {description, quantity, unit_price, total})
- subtotal
- tax_amount
- total_amount
- payment_terms
- notes

Devuelve SOLO JSON válido con todos los campos encontrados. Usa null para valores faltantes.`
  },

  receipt: {
    en: `You are an expert receipt processor. Extract all relevant transaction information from this receipt.

Required fields:
- merchant_name
- merchant_address
- merchant_phone
- transaction_date
- transaction_time
- items (array of {name, quantity, price})
- subtotal
- tax
- total
- payment_method
- transaction_id
- merchant_id

Return ONLY valid JSON with all found fields. Use null for missing values.`,

    es: `Eres un experto en procesamiento de recibos. Extrae toda la información de transacción de este recibo.

Campos requeridos:
- merchant_name
- merchant_address
- merchant_phone
- transaction_date
- transaction_time
- items (array of {name, quantity, price})
- subtotal
- tax
- total
- payment_method
- transaction_id
- merchant_id

Devuelve SOLO JSON válido con todos los campos encontrados. Usa null para valores faltantes.`
  },

  contract: {
    en: `You are an expert contract analyst. Extract all key information from this contract.

Required fields:
- contract_title
- contract_date
- effective_date
- expiration_date
- party_a_name
- party_a_address
- party_a_contact
- party_b_name
- party_b_address
- party_b_contact
- contract_value
- payment_terms
- key_deliverables (array)
- termination_clause
- renewal_terms
- special_conditions (array)

Return ONLY valid JSON with all found fields. Use null for missing values.`,

    es: `Eres un experto analista de contratos. Extrae toda la información clave de este contrato.

Campos requeridos:
- contract_title
- contract_date
- effective_date
- expiration_date
- party_a_name
- party_a_address
- party_a_contact
- party_b_name
- party_b_address
- party_b_contact
- contract_value
- payment_terms
- key_deliverables (array)
- termination_clause
- renewal_terms
- special_conditions (array)

Devuelve SOLO JSON válido con todos los campos encontrados. Usa null para valores faltantes.`
  },

  form: {
    en: `You are an expert form processor. Extract all filled information from this form.

Identify:
- form_title
- form_date
- form_type
- all_fields (object with field_name: value pairs)
- required_fields_filled (boolean)
- missing_fields (array)

Return ONLY valid JSON with extracted form data.`,

    es: `Eres un experto procesador de formularios. Extrae toda la información rellenada de este formulario.

Identifica:
- form_title
- form_date
- form_type
- all_fields (objeto con pares field_name: value)
- required_fields_filled (boolean)
- missing_fields (array)

Devuelve SOLO JSON válido con datos de formulario extraídos.`
  },

  passport: {
    en: `You are an expert document processor for passports. Extract all passport information.

Required fields:
- surname
- given_names
- nationality
- date_of_birth
- sex
- place_of_birth
- date_of_issue
- date_of_expiry
- passport_number
- issuing_country
- mrz_line_1
- mrz_line_2

Return ONLY valid JSON with all found fields. Use null for missing values.`,

    es: `Eres un experto procesador de documentos de pasaportes. Extrae toda la información del pasaporte.

Campos requeridos:
- surname
- given_names
- nationality
- date_of_birth
- sex
- place_of_birth
- date_of_issue
- date_of_expiry
- passport_number
- issuing_country
- mrz_line_1
- mrz_line_2

Devuelve SOLO JSON válido con todos los campos encontrados. Usa null para valores faltantes.`
  },

  business_card: {
    en: `You are an expert business card processor. Extract all contact information.

Required fields:
- full_name
- title
- company
- email
- phone
- address
- website
- linkedin

Return ONLY valid JSON with all found fields. Use null for missing values.`,

    es: `Eres un experto procesador de tarjetas de visita. Extrae toda la información de contacto.

Campos requeridos:
- full_name
- title
- company
- email
- phone
- address
- website
- linkedin

Devuelve SOLO JSON válido con todos los campos encontrados. Usa null para valores faltantes.`
  },

  medical_form: {
    en: `You are a medical data extraction specialist. Extract all patient information from this form.

Required fields:
- patient_name
- date_of_birth
- gender
- patient_id
- insurance_provider
- insurance_id
- primary_physician
- chief_complaint
- medical_history (array)
- current_medications (array)
- allergies (array)
- emergency_contact
- signature_date

Return ONLY valid JSON with all found fields. Use null for missing values.`,

    es: `Eres un especialista en extracción de datos médicos. Extrae toda la información del paciente de este formulario.

Campos requeridos:
- patient_name
- date_of_birth
- gender
- patient_id
- insurance_provider
- insurance_id
- primary_physician
- chief_complaint
- medical_history (array)
- current_medications (array)
- allergies (array)
- emergency_contact
- signature_date

Devuelve SOLO JSON válido con todos los campos encontrados. Usa null para valores faltantes.`
  },

  default: {
    en: `You are a general document processor. Extract all relevant information from this document.

Identify:
- document_type
- document_title
- key_entities (object with entity_name: value)
- dates_mentioned (array)
- amounts_mentioned (array)
- email_addresses (array)
- phone_numbers (array)
- addresses (array)
- summary (brief overview of content)

Return ONLY valid JSON with extracted data.`,

    es: `Eres un procesador general de documentos. Extrae toda la información relevante de este documento.

Identifica:
- document_type
- document_title
- key_entities (objeto con entity_name: value)
- dates_mentioned (array)
- amounts_mentioned (array)
- email_addresses (array)
- phone_numbers (array)
- addresses (array)
- summary (descripción general del contenido)

Devuelve SOLO JSON válido con datos extraídos.`
  }
};

/**
 * Get extraction system prompt for document type
 */
function getExtractionSystemPrompt(documentType = 'default', language = 'en') {
  const prompts = EXTRACTION_PROMPTS[documentType] || EXTRACTION_PROMPTS['default'];
  return prompts[language] || prompts['en'];
}

/**
 * Get all extraction prompts
 */
function getAllExtractionPrompts() {
  return EXTRACTION_PROMPTS;
}

/**
 * Get supported document types
 */
function getSupportedDocumentTypes() {
  return Object.keys(EXTRACTION_PROMPTS).filter(k => k !== 'default');
}

module.exports = {
  EXTRACTION_PROMPTS,
  getExtractionSystemPrompt,
  getAllExtractionPrompts,
  getSupportedDocumentTypes
};
