import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Inicialização do Firebase
export const app = initializeApp(firebaseConfig);

// CRITICAL: getFirestore com o firestoreDatabaseId específico
export const firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
    },
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface TestResult {
  sucesso: boolean;
  mensagem: string;
  projectId: string;
  databaseId: string;
  timestamp: string;
  latenciaMs?: number;
  detalhes?: any;
}

/**
 * Executa o teste de leitura e gravação no Firestore para validar a integração ativa
 */
export async function testFirebaseConnection(): Promise<TestResult> {
  const startTime = Date.now();
  const testDocId = `test_healthcheck_${Date.now()}`;
  const testPath = 'test';

  try {
    // 1. Teste de Gravação (Write)
    const testDocRef = doc(firestore, testPath, testDocId);
    await setDoc(testDocRef, {
      status: 'ONLINE',
      app: 'Recebe Fácil ERP',
      mensagem: 'Teste de conexão e integridade realizado com sucesso',
      criadoEm: new Date().toISOString(),
      timestampServidor: serverTimestamp(),
    });

    // 2. Teste de Leitura direta do Servidor (getDocFromServer)
    const snap = await getDocFromServer(testDocRef);
    const latency = Date.now() - startTime;

    if (!snap.exists()) {
      throw new Error('Documento de teste gravado não pôde ser recuperado do Firestore.');
    }

    return {
      sucesso: true,
      mensagem: 'Conexão com Firebase Firestore estabelecida com sucesso!',
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      timestamp: new Date().toISOString(),
      latenciaMs: latency,
      detalhes: {
        documentoId: testDocId,
        dadosGravados: snap.data(),
        leituraServidor: true,
      },
    };
  } catch (error: any) {
    console.error('Erro ao testar Firebase:', error);
    return {
      sucesso: false,
      mensagem: error.message || 'Falha ao conectar com o Firebase Firestore.',
      projectId: firebaseConfig.projectId,
      databaseId: firebaseConfig.firestoreDatabaseId,
      timestamp: new Date().toISOString(),
      latenciaMs: Date.now() - startTime,
      detalhes: {
        erro: error.toString(),
      },
    };
  }
}
