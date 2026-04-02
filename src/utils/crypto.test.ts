/**
 * ============================================================================
 * Testes Unitários — Módulo de Criptografia E2EE
 * ============================================================================
 *
 * Verifica o ciclo completo de criptografia:
 * 1. Geração de salt
 * 2. Derivação de chave (PBKDF2)
 * 3. Geração de MEK
 * 4. Wrap/Unwrap da MEK
 * 5. Encrypt/Decrypt de dados
 * 6. Integridade (dados adulterados → falha)
 * 7. Troca de senha (re-wrap MEK)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  generateSalt,
  deriveKey,
  generateMasterKey,
  wrapMasterKey,
  unwrapMasterKey,
  encryptData,
  decryptData,
  bufferToBase64,
  base64ToBuffer,
} from './crypto';

describe('E2EE Crypto Module', () => {
  // ========================================================================
  // Funções auxiliares de codificação
  // ========================================================================

  describe('Base64 encoding/decoding', () => {
    it('deve converter ArrayBuffer para Base64 e vice-versa', () => {
      const original = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
      const base64 = bufferToBase64(original.buffer);
      const decoded = new Uint8Array(base64ToBuffer(base64));

      expect(decoded).toEqual(original);
    });

    it('deve lidar com dados binários arbitrários', () => {
      const original = crypto.getRandomValues(new Uint8Array(256));
      const base64 = bufferToBase64(original.buffer);
      const decoded = new Uint8Array(base64ToBuffer(base64));

      expect(decoded).toEqual(original);
    });
  });

  // ========================================================================
  // Geração de Salt
  // ========================================================================

  describe('generateSalt()', () => {
    it('deve gerar um salt em Base64', () => {
      const salt = generateSalt();
      expect(typeof salt).toBe('string');
      expect(salt.length).toBeGreaterThan(0);
    });

    it('deve gerar salts únicos a cada chamada', () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      expect(salt1).not.toEqual(salt2);
    });

    it('deve gerar salt de 16 bytes (decodificado)', () => {
      const salt = generateSalt();
      const buffer = base64ToBuffer(salt);
      expect(new Uint8Array(buffer).length).toBe(16);
    });
  });

  // ========================================================================
  // Derivação de Chave (PBKDF2)
  // ========================================================================

  describe('deriveKey()', () => {
    it('deve derivar uma CryptoKey a partir de senha e salt', async () => {
      const salt = generateSalt();
      const key = await deriveKey('minha-senha-segura', salt);

      expect(key).toBeDefined();
      expect(key.type).toBe('secret');
      expect(key.algorithm.name).toBe('AES-GCM');
    });

    it('mesma senha + mesmo salt = mesma chave (determinístico)', async () => {
      const salt = generateSalt();
      const key1 = await deriveKey('senha-teste', salt);
      const key2 = await deriveKey('senha-teste', salt);

      // Não podemos comparar CryptoKeys diretamente, mas podemos
      // verificar que ambas produzem o mesmo resultado ao wrap/unwrap
      const mek = await generateMasterKey();
      const wrapped1 = await wrapMasterKey(mek, key1);
      // A unwrap com key2 deve funcionar porque key1 === key2
      const unwrapped = await unwrapMasterKey(wrapped1.wrappedKey, wrapped1.iv, key2);
      expect(unwrapped).toBeDefined();
    });

    it('senhas diferentes + mesmo salt = chaves diferentes', async () => {
      const salt = generateSalt();
      const key1 = await deriveKey('senha-A', salt);
      const key2 = await deriveKey('senha-B', salt);

      // Verificamos que key2 NÃO consegue unwrap algo encrypted com key1
      const mek = await generateMasterKey();
      const wrapped = await wrapMasterKey(mek, key1);

      await expect(
        unwrapMasterKey(wrapped.wrappedKey, wrapped.iv, key2)
      ).rejects.toThrow();
    });

    it('mesma senha + salts diferentes = chaves diferentes', async () => {
      const salt1 = generateSalt();
      const salt2 = generateSalt();
      const key1 = await deriveKey('mesma-senha', salt1);
      const key2 = await deriveKey('mesma-senha', salt2);

      const mek = await generateMasterKey();
      const wrapped = await wrapMasterKey(mek, key1);

      await expect(
        unwrapMasterKey(wrapped.wrappedKey, wrapped.iv, key2)
      ).rejects.toThrow();
    });
  });

  // ========================================================================
  // Master Encryption Key (MEK)
  // ========================================================================

  describe('MEK Generation, Wrap & Unwrap', () => {
    it('deve gerar uma MEK válida', async () => {
      const mek = await generateMasterKey();
      expect(mek).toBeDefined();
      expect(mek.type).toBe('secret');
      expect(mek.algorithm.name).toBe('AES-GCM');
      expect(mek.extractable).toBe(true); // Necessário para wrap
    });

    it('deve encapsular e desencapsular a MEK corretamente', async () => {
      const salt = generateSalt();
      const dek = await deriveKey('minha-senha', salt);
      const mek = await generateMasterKey();

      // Wrap
      const { wrappedKey, iv } = await wrapMasterKey(mek, dek);
      expect(wrappedKey).toBeDefined();
      expect(iv).toBeDefined();

      // Unwrap
      const unwrappedMek = await unwrapMasterKey(wrappedKey, iv, dek);
      expect(unwrappedMek).toBeDefined();
      expect(unwrappedMek.type).toBe('secret');

      // A MEK desencapsulada deve funcionar para encrypt/decrypt
      const testData = { name: 'Conta de Luz', value: 150.99 };
      const encrypted = await encryptData(testData, unwrappedMek);
      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, unwrappedMek);
      expect(decrypted).toEqual(testData);
    });

    it('deve falhar ao desencapsular com DEK errada', async () => {
      const salt = generateSalt();
      const dekCorreta = await deriveKey('senha-correta', salt);
      const dekErrada = await deriveKey('senha-errada', generateSalt());
      const mek = await generateMasterKey();

      const { wrappedKey, iv } = await wrapMasterKey(mek, dekCorreta);

      await expect(
        unwrapMasterKey(wrappedKey, iv, dekErrada)
      ).rejects.toThrow();
    });
  });

  // ========================================================================
  // Criptografia e Descriptografia de Dados
  // ========================================================================

  describe('encryptData() & decryptData()', () => {
    let mek: CryptoKey;

    // Gera uma MEK para todos os testes desta seção
    beforeAll(async () => {
      mek = await generateMasterKey();
    });

    it('deve criptografar e descriptografar um objeto simples', async () => {
      const original = { name: 'Conta de Água', value: 89.50 };
      const encrypted = await encryptData(original, mek);

      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.iv).toBeDefined();
      expect(typeof encrypted.ciphertext).toBe('string');
      expect(typeof encrypted.iv).toBe('string');

      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, mek);
      expect(decrypted).toEqual(original);
    });

    it('deve criptografar e descriptografar strings', async () => {
      const original = 'Informação confidencial do usuário';
      const encrypted = await encryptData(original, mek);
      const decrypted = await decryptData<string>(encrypted.ciphertext, encrypted.iv, mek);
      expect(decrypted).toEqual(original);
    });

    it('deve criptografar e descriptografar objetos complexos', async () => {
      const original = {
        name: 'Investimento CDB',
        initialAmount: 10000.00,
        cdiPercent: 110,
        details: {
          bank: 'Banco Seguro',
          type: 'CDB',
        },
        tags: ['renda-fixa', 'cdb', 'longo-prazo'],
      };
      const encrypted = await encryptData(original, mek);
      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, mek);
      expect(decrypted).toEqual(original);
    });

    it('deve gerar IVs diferentes para cada criptografia', async () => {
      const data = { name: 'Mesmos dados' };
      const encrypted1 = await encryptData(data, mek);
      const encrypted2 = await encryptData(data, mek);

      // IVs devem ser diferentes (aleatórios)
      expect(encrypted1.iv).not.toEqual(encrypted2.iv);
      // Ciphertexts também devem ser diferentes (por causa do IV)
      expect(encrypted1.ciphertext).not.toEqual(encrypted2.ciphertext);
    });

    it('deve falhar ao descriptografar com chave errada', async () => {
      const outraMek = await generateMasterKey();
      const data = { name: 'Dados secretos' };
      const encrypted = await encryptData(data, mek);

      await expect(
        decryptData(encrypted.ciphertext, encrypted.iv, outraMek)
      ).rejects.toThrow();
    });

    it('deve falhar ao descriptografar dados adulterados (verificação de integridade)', async () => {
      const data = { name: 'Dados originais', value: 100 };
      const encrypted = await encryptData(data, mek);

      // Adultera o ciphertext (altera um caractere)
      const tampered = encrypted.ciphertext.slice(0, -2) + 'XX';

      await expect(
        decryptData(tampered, encrypted.iv, mek)
      ).rejects.toThrow();
    });

    it('deve falhar com IV incorreto', async () => {
      const data = { name: 'Teste IV' };
      const encrypted = await encryptData(data, mek);

      // Usa um IV diferente
      const wrongIv = bufferToBase64(crypto.getRandomValues(new Uint8Array(12)).buffer);

      await expect(
        decryptData(encrypted.ciphertext, wrongIv, mek)
      ).rejects.toThrow();
    });

    it('deve lidar com caracteres unicode (emojis, acentos)', async () => {
      const original = {
        name: '💰 Conta de Março — R$ 1.500,00',
        description: 'Pagamento référence №12345',
      };
      const encrypted = await encryptData(original, mek);
      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, mek);
      expect(decrypted).toEqual(original);
    });
  });

  // ========================================================================
  // Cenário de Troca de Senha
  // ========================================================================

  describe('Troca de Senha (Re-wrap MEK)', () => {
    it('deve manter acesso aos dados após troca de senha', async () => {
      // 1. Setup inicial com senha antiga
      const saltAntigo = generateSalt();
      const dekAntiga = await deriveKey('senha-antiga', saltAntigo);
      const mek = await generateMasterKey();
      const wrappedAntigo = await wrapMasterKey(mek, dekAntiga);

      // 2. Criptografa dados com a MEK
      const dados = { name: 'Conta importante', value: 500.00 };
      const encrypted = await encryptData(dados, mek);

      // 3. Troca de senha: re-wrap a MEK
      const saltNovo = generateSalt();
      const dekNova = await deriveKey('senha-nova', saltNovo);

      // Desencapsula com DEK antiga
      const mekRecuperada = await unwrapMasterKey(
        wrappedAntigo.wrappedKey,
        wrappedAntigo.iv,
        dekAntiga
      );

      // Re-encapsula com DEK nova
      const wrappedNovo = await wrapMasterKey(mekRecuperada, dekNova);

      // 4. Verifica que a MEK re-encapsulada funciona
      const mekFinal = await unwrapMasterKey(
        wrappedNovo.wrappedKey,
        wrappedNovo.iv,
        dekNova
      );

      // 5. Descriptografa os dados antigos com a MEK final
      const decrypted = await decryptData(encrypted.ciphertext, encrypted.iv, mekFinal);
      expect(decrypted).toEqual(dados);
    });

    it('senha antiga NÃO deve funcionar após troca', async () => {
      const salt = generateSalt();
      const dekAntiga = await deriveKey('senha-antiga', salt);
      const mek = await generateMasterKey();
      const wrappedAntigo = await wrapMasterKey(mek, dekAntiga);

      // Troca de senha
      const saltNovo = generateSalt();
      const dekNova = await deriveKey('senha-nova', saltNovo);
      const mekRecuperada = await unwrapMasterKey(
        wrappedAntigo.wrappedKey,
        wrappedAntigo.iv,
        dekAntiga
      );
      const wrappedNovo = await wrapMasterKey(mekRecuperada, dekNova);

      // Tenta usar a DEK antiga com o wrappedKey novo → DEVE FALHAR
      await expect(
        unwrapMasterKey(wrappedNovo.wrappedKey, wrappedNovo.iv, dekAntiga)
      ).rejects.toThrow();
    });
  });

  // ========================================================================
  // Cenário End-to-End Completo
  // ========================================================================

  describe('Fluxo E2EE Completo (simulação)', () => {
    it('deve simular o fluxo completo: setup → encrypt → decrypt', async () => {
      // === SETUP (primeiro login) ===
      const password = 'Andrade1312@';
      const salt = generateSalt();
      const dek = await deriveKey(password, salt);
      const mek = await generateMasterKey();
      const wrapped = await wrapMasterKey(mek, dek);

      // Servidor armazenaria: { salt, wrappedKey: wrapped.wrappedKey, iv: wrapped.iv }
      // Servidor NUNCA vê a MEK

      // === ESCRITA (criar conta) ===
      const billData = {
        name: 'Aluguel Junho 2026',
        value: 1800.50,
      };
      const encryptedBill = await encryptData(billData, mek);

      // Servidor recebe: { encrypted_data: encryptedBill.ciphertext, encryption_iv: encryptedBill.iv, due_date: '2026-06-10' }
      // Servidor armazena blob opaco

      // === LEITURA (buscar conta) ===
      // Servidor retorna: { encrypted_data: ..., encryption_iv: ..., due_date: '2026-06-10' }

      // Frontend: re-derive key do password + salt do servidor
      const dek2 = await deriveKey(password, salt);
      const mek2 = await unwrapMasterKey(wrapped.wrappedKey, wrapped.iv, dek2);

      // Descriptografa
      const decryptedBill = await decryptData<typeof billData>(
        encryptedBill.ciphertext,
        encryptedBill.iv,
        mek2
      );

      expect(decryptedBill).toEqual(billData);
      expect(decryptedBill.name).toBe('Aluguel Junho 2026');
      expect(decryptedBill.value).toBe(1800.50);
    });

    it('outro usuário NÃO deve conseguir descriptografar', async () => {
      // Usuário A criptografa
      const saltA = generateSalt();
      const dekA = await deriveKey('senha-usuario-A', saltA);
      const mekA = await generateMasterKey();
      const encrypted = await encryptData({ name: 'Dado privado de A' }, mekA);

      // Usuário B tenta descriptografar com sua própria chave
      const saltB = generateSalt();
      const dekB = await deriveKey('senha-usuario-B', saltB);
      const mekB = await generateMasterKey();

      await expect(
        decryptData(encrypted.ciphertext, encrypted.iv, mekB)
      ).rejects.toThrow();
    });
  });
});
