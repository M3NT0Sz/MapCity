// Funções para validação de CPF e CNPJ
class ValidadorDocumento {
  
  // Validar CPF
  static validarCPF(cpf) {
    // Remove caracteres não numéricos
    cpf = cpf.replace(/[^\d]/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do primeiro dígito verificador
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let resto = 11 - (soma % 11);
    let digito1 = resto === 10 || resto === 11 ? 0 : resto;
    
    if (digito1 !== parseInt(cpf.charAt(9))) return false;
    
    // Validação do segundo dígito verificador
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    resto = 11 - (soma % 11);
    let digito2 = resto === 10 || resto === 11 ? 0 : resto;
    
    return digito2 === parseInt(cpf.charAt(10));
  }
  
  // Validar CNPJ
  static validarCNPJ(cnpj) {
    // Remove caracteres não numéricos
    cnpj = cnpj.replace(/[^\d]/g, '');
    
    // Verifica se tem 14 dígitos
    if (cnpj.length !== 14) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{13}$/.test(cnpj)) return false;
    
    // Validação do primeiro dígito verificador
    let tamanho = cnpj.length - 2;
    let numeros = cnpj.substring(0, tamanho);
    let digitos = cnpj.substring(tamanho);
    let soma = 0;
    let pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    if (resultado !== parseInt(digitos.charAt(0))) return false;
    
    // Validação do segundo dígito verificador
    tamanho = tamanho + 1;
    numeros = cnpj.substring(0, tamanho);
    soma = 0;
    pos = tamanho - 7;
    
    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado === parseInt(digitos.charAt(1));
  }
  
  // Formatar CPF
  static formatarCPF(cpf) {
    cpf = cpf.replace(/[^\d]/g, '');
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  
  // Formatar CNPJ
  static formatarCNPJ(cnpj) {
    cnpj = cnpj.replace(/[^\d]/g, '');
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  
  // Detectar tipo de documento
  static detectarTipoDocumento(documento) {
    documento = documento.replace(/[^\d]/g, '');
    
    if (documento.length === 11) {
      return this.validarCPF(documento) ? 'cpf' : null;
    } else if (documento.length === 14) {
      return this.validarCNPJ(documento) ? 'cnpj' : null;
    }
    
    return null;
  }
  
  // Validar documento (CPF ou CNPJ)
  static validarDocumento(documento) {
    const tipo = this.detectarTipoDocumento(documento);
    
    if (!tipo) return { valido: false, tipo: null, erro: 'Documento inválido' };
    
    documento = documento.replace(/[^\d]/g, '');
    
    const valido = tipo === 'cpf' ? this.validarCPF(documento) : this.validarCNPJ(documento);
    
    return {
      valido,
      tipo,
      documentoLimpo: documento,
      documentoFormatado: tipo === 'cpf' ? this.formatarCPF(documento) : this.formatarCNPJ(documento),
      erro: valido ? null : `${tipo.toUpperCase()} inválido`
    };
  }
}

module.exports = ValidadorDocumento;
