import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Upload, Loader2, FileText, AlertTriangle, Download, CheckCircle2, XCircle } from 'lucide-react';
import { useBulkUpdateStock } from '@/hooks/useMaterials';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface BulkUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

interface BulkItem {
  codigo: string;
  nome: string;
  unidade_medida: string;
  quantidade: number;
  descricao?: string;
  categoria?: string;
  quantidade_minima?: number;
  localizacao?: string;
}

interface ResultSummary {
  createdCount: number;
  updatedCount: number;
  errors: { item: BulkItem; message: string }[];
}

const BulkUploadDialog: React.FC<BulkUploadDialogProps> = ({ isOpen, onOpenChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsingError, setParsingError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BulkItem[]>([]);
  const [result, setResult] = useState<ResultSummary | null>(null);
  const bulkMutation = useBulkUpdateStock();

  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setParsingError(null);
    setResult(null);
    onOpenChange(false);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setParsingError(null);
    setPreview([]);
    setResult(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const validTypes = [
      'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];

    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      setParsingError('Formato inválido. Use CSV ou Excel (.xlsx).');
      setFile(null);
      return;
    }

    setFile(selectedFile);

    try {
      const items = await parseFile(selectedFile);
      setPreview(items);
    } catch (e) {
      setParsingError(e instanceof Error ? e.message : 'Erro ao ler o arquivo.');
      setFile(null);
    }
  };

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [
      ['codigo', 'nome', 'unidade_medida', 'quantidade', 'descricao', 'categoria', 'quantidade_minima', 'localizacao'],
      ['P-1001', 'Parafuso M8', 'UN', 50, 'Parafuso sextavado de aço', 'Fixadores', 10, 'Prateleira A1'],
      ['C-2005', 'Cabo de Força', 'MT', 100, '', 'Elétrica', 5, 'Prateleira B2'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Materiais');
    XLSX.writeFile(wb, `modelo_carga_massa_${format(new Date(), 'yyyyMMdd')}.xlsx`);
  };

  const parseFile = async (file: File): Promise<BulkItem[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const rows: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (rows.length === 0) {
            reject(new Error('O arquivo está vazio ou sem dados válidos.'));
            return;
          }

          const items: BulkItem[] = [];
          const errors: string[] = [];

          rows.forEach((row, index) => {
            const lineNum = index + 2;
            const codigo = String(row['codigo'] || '').trim();
            const nome = String(row['nome'] || '').trim();
            const unidade_medida = String(row['unidade_medida'] || '').trim();
            const quantidade = Number(row['quantidade']);

            if (!codigo) { errors.push(`Linha ${lineNum}: campo "codigo" obrigatório.`); return; }
            if (!nome) { errors.push(`Linha ${lineNum}: campo "nome" obrigatório.`); return; }
            if (!unidade_medida) { errors.push(`Linha ${lineNum}: campo "unidade_medida" obrigatório.`); return; }
            if (isNaN(quantidade) || quantidade <= 0) { errors.push(`Linha ${lineNum}: campo "quantidade" deve ser número maior que 0.`); return; }

            items.push({
              codigo, nome, unidade_medida, quantidade,
              descricao: String(row['descricao'] || '').trim() || undefined,
              categoria: String(row['categoria'] || '').trim() || undefined,
              quantidade_minima: row['quantidade_minima'] ? Number(row['quantidade_minima']) : 0,
              localizacao: String(row['localizacao'] || '').trim() || undefined,
            });
          });

          if (errors.length > 0) { reject(new Error(errors.join('\n'))); return; }
          resolve(items);
        } catch (err) {
          reject(new Error('Erro ao processar o arquivo. Verifique o formato.'));
        }
      };

      reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!file || preview.length === 0) return;

    try {
      const data = await bulkMutation.mutateAsync(preview);
      setResult(data);
    } catch (e) {
      setParsingError(e instanceof Error ? e.message : JSON.stringify(e));
    }
  };

  const isPending = bulkMutation.isPending;
  const hasErrors = result && result.errors.length > 0;
  const isSuccess = result && result.errors.length === 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Carga de Estoque em Massa</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV ou Excel para cadastrar ou atualizar materiais.
          </DialogDescription>
        </DialogHeader>

        {/* RESULTADO DA CARGA */}
        {result ? (
          <div className="space-y-4 py-2">
            {isSuccess ? (
              <Alert className="border-green-500 bg-green-50">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <AlertTitle className="text-green-800 text-base">Carga concluída com sucesso!</AlertTitle>
                <AlertDescription className="text-green-700 space-y-1 mt-2">
                  <p>✅ <strong>{result.createdCount}</strong> novo(s) material(is) cadastrado(s)</p>
                  <p>🔄 <strong>{result.updatedCount}</strong> estoque(s) atualizado(s)</p>
                  <p>📦 Total processado: <strong>{result.createdCount + result.updatedCount}</strong> item(ns)</p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <XCircle className="h-5 w-5" />
                <AlertTitle className="text-base">Carga concluída com falhas</AlertTitle>
                <AlertDescription className="space-y-1 mt-2">
                  <p>✅ <strong>{result.createdCount}</strong> novo(s) material(is) cadastrado(s)</p>
                  <p>🔄 <strong>{result.updatedCount}</strong> estoque(s) atualizado(s)</p>
                  <p>❌ <strong>{result.errors.length}</strong> item(ns) com erro:</p>
                  <ul className="mt-1 space-y-1 text-xs">
                    {result.errors.map((e, i) => (
                      <li key={i}>• {e.item.codigo} — {e.message}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <DialogFooter>
              <Button onClick={handleClose} className="w-full">
                OK — Fechar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          /* FORMULÁRIO DE UPLOAD */
          <div className="space-y-4 py-4">
            <Alert variant="default">
              <FileText className="h-4 w-4" />
              <AlertTitle>Colunas obrigatórias</AlertTitle>
              <AlertDescription>
                <span className="font-semibold">codigo, nome, unidade_medida, quantidade</span>
                <br />
                Opcionais: descricao, categoria, quantidade_minima, localizacao
              </AlertDescription>
            </Alert>

            <Button onClick={handleDownloadTemplate} variant="outline" className="w-full" disabled={isPending}>
              <Download className="mr-2 h-4 w-4" />
              Baixar Modelo Excel
            </Button>

            {parsingError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Erro no arquivo</AlertTitle>
                <AlertDescription className="whitespace-pre-line">{parsingError}</AlertDescription>
              </Alert>
            )}

            <Input
              type="file"
              accept=".csv, .xlsx, .xls"
              onChange={handleFileChange}
              disabled={isPending}
            />

            {preview.length > 0 && (
              <Alert variant="default">
                <FileText className="h-4 w-4" />
                <AlertTitle>Pré-visualização</AlertTitle>
                <AlertDescription>
                  {preview.length} itens encontrados no arquivo e prontos para envio.
                </AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleUpload}
              disabled={!file || preview.length === 0 || isPending}
              className="w-full"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando Carga...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Iniciar Carga em Massa ({preview.length} itens)
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;