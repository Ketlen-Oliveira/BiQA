import React, { useState, useRef } from 'react'
import { Modal, Button, Form, Alert, ProgressBar } from 'react-bootstrap'
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, X } from 'lucide-react'
import { processBatchUtterances, downloadBatchTemplate } from '../../api'
import { SUPPORTED_LANGUAGES } from '../../types'

interface BatchUploadModalProps {
  show: boolean
  onHide: () => void
  defaultLang?: string
}

export const BatchUploadModal: React.FC<BatchUploadModalProps> = ({
  show,
  onHide,
  defaultLang = 'es-MX',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [lang, setLang] = useState<string>(defaultLang)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'danger'; text: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleReset = () => {
    setSelectedFile(null)
    setResultMessage(null)
    setProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    if (!isProcessing) {
      handleReset()
      onHide()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setSelectedFile(file)
      setResultMessage(null)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      setSelectedFile(file)
      setResultMessage(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      setResultMessage({ type: 'danger', text: 'Selecione um arquivo .xlsx para processar.' })
      return
    }

    setIsProcessing(true)
    setProgress(30)
    setResultMessage(null)

    const timer = setInterval(() => {
      setProgress((p) => (p < 85 ? p + 15 : p))
    }, 400)

    try {
      const res = await processBatchUtterances(selectedFile, lang)
      clearInterval(timer)
      setProgress(100)

      if (res.success) {
        setResultMessage({
          type: 'success',
          text: 'Planilha processada. O download do resultado foi iniciado.',
        })
      } else {
        setResultMessage({
          type: 'danger',
          text: res.error || 'Erro ao processar a planilha.',
        })
      }
    } catch {
      clearInterval(timer)
      setResultMessage({
        type: 'danger',
        text: 'Erro de comunicação ao enviar arquivo.',
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" className="batch-modal">
      <Modal.Header closeButton={!isProcessing} className="border-0 pb-0">
        <Modal.Title className="h5 fw-bold d-flex align-items-center gap-2 text-primary">
          <FileSpreadsheet className="icon-md text-primary" />
          Processamento de Planilha em Lote
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="pt-3">
        <p className="text-muted small mb-3">
          Envie um arquivo Excel (.xlsx) contendo uma lista de frases de utterances para buscar
          os respectivos UIDs, conteúdos e status simultaneamente.
        </p>

        {resultMessage && (
          <Alert variant={resultMessage.type} className="py-2.5 small mb-3 d-flex align-items-center gap-2">
            {resultMessage.type === 'success' ? (
              <CheckCircle2 size={16} className="text-success flex-shrink-0" />
            ) : (
              <AlertTriangle size={16} className="text-danger flex-shrink-0" />
            )}
            <span>{resultMessage.text}</span>
          </Alert>
        )}

        <Form onSubmit={handleSubmit}>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <Form.Label className="small fw-semibold text-secondary">
                Idioma das Utterances:
              </Form.Label>
              <Form.Select
                size="sm"
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                disabled={isProcessing}
              >
                {SUPPORTED_LANGUAGES.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.label}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-6 d-flex align-items-end">
              <Button
                variant="outline-secondary"
                size="sm"
                className="w-100 d-flex align-items-center justify-content-center gap-1.5"
                onClick={downloadBatchTemplate}
                type="button"
              >
                <Download size={14} />
                Baixar Modelo de Planilha (.xlsx)
              </Button>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div
            className={`file-drop-area ${isDragging ? 'is-dragging' : ''} ${selectedFile ? 'has-file' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              disabled={isProcessing}
            />

            {selectedFile ? (
              <div className="d-flex align-items-center justify-content-between w-100 px-3">
                <div className="d-flex align-items-center gap-2 text-dark">
                  <FileSpreadsheet className="text-success" size={24} />
                  <div className="text-start">
                    <div className="fw-semibold small">{selectedFile.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                {!isProcessing && (
                  <button
                    type="button"
                    className="btn btn-sm btn-link text-muted p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleReset()
                    }}
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <Upload size={32} className="text-primary mb-2 opacity-75" />
                <div className="fw-medium small text-dark">
                  Arraste e solte o arquivo .xlsx aqui ou <span className="text-primary text-decoration-underline">clique para selecionar</span>
                </div>
                <div className="text-muted mt-1" style={{ fontSize: '0.78rem' }}>
                  Suporta arquivos .xlsx de até 10MB
                </div>
              </div>
            )}
          </div>

          {isProcessing && (
            <div className="mt-3">
              <div className="d-flex justify-content-between small text-muted mb-1">
                <span>Processando linhas da planilha...</span>
                <span>{progress}%</span>
              </div>
              <ProgressBar now={progress} animated={progress < 100} variant="primary" style={{ height: '6px' }} />
            </div>
          )}

          <div className="d-flex justify-content-end gap-2 mt-4 pt-2 border-top">
            <Button variant="light" size="sm" onClick={handleClose} disabled={isProcessing}>
              Fechar
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!selectedFile || isProcessing}
              className="d-flex align-items-center gap-1.5 px-3"
            >
              <Upload size={14} />
              {isProcessing ? 'Processando...' : 'Processar e Baixar Resultados'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  )
}
