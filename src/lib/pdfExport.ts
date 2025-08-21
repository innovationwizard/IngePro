import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface PDFExportOptions {
  title: string
  subtitle?: string
  companyName?: string
  dateRange?: string
  isAnonymized: boolean
}

export interface ProgressUpdateForPDF {
  id: string
  task: {
    name: string
    category: {
      name: string
    }
  }
  project: {
    name: string
  }
  worker: {
    name: string
    id: string
  }
  amountCompleted: number
  status: string
  validationStatus: string
  createdAt: string
  additionalAttributes?: string
  materialConsumptions: Array<{
    material: {
      name: string
      unit: string
    }
    quantity: number
  }>
  materialLosses: Array<{
    material: {
      name: string
      unit: string
    }
    quantity: number
  }>
  totalConsumption: number
  totalLoss: number
}

export interface SummaryForPDF {
  totalUpdates: number
  totalAmountCompleted: number
  totalConsumption: number
  totalLoss: number
  pendingValidation: number
  validatedUpdates: number
  rejectedUpdates: number
}

export interface ProjectSummaryForPDF {
  project: {
    name: string
  }
  totalUpdates: number
  totalAmount: number
  totalConsumption: number
  totalLoss: number
  pendingValidation: number
  validatedUpdates: number
  rejectedUpdates: number
}

export class PDFExporter {
  private doc: jsPDF
  private currentY: number = 20
  private pageWidth: number
  private margin: number = 20

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.pageWidth = this.doc.internal.pageSize.getWidth()
  }

  private addHeader(options: PDFExportOptions) {
    // Company logo/name
    if (options.companyName) {
      this.doc.setFontSize(18)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text(options.companyName, this.margin, this.currentY)
      this.currentY += 10
    }

    // Title
    this.doc.setFontSize(16)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(options.title, this.margin, this.currentY)
    this.currentY += 8

    // Subtitle
    if (options.subtitle) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(options.subtitle, this.margin, this.currentY)
      this.currentY += 8
    }

    // Date range
    if (options.dateRange) {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(`Período: ${options.dateRange}`, this.margin, this.currentY)
      this.currentY += 8
    }

    // Anonymization notice
    if (options.isAnonymized) {
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'italic')
      this.doc.setTextColor(100, 100, 100)
      this.doc.text('* Información de trabajadores anonimizada para facturación', this.margin, this.currentY)
      this.doc.setTextColor(0, 0, 0)
      this.currentY += 8
    }

    this.currentY += 10
  }

  private addSummarySection(summary: SummaryForPDF) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Resumen General', this.margin, this.currentY)
    this.currentY += 8

    // Summary table
    const summaryData = [
      ['Total Actualizaciones', summary.totalUpdates.toString()],
      ['Cantidad Total Completada', summary.totalAmountCompleted.toFixed(2)],
      ['Consumo Total de Materiales', summary.totalConsumption.toFixed(2)],
      ['Pérdida Total de Materiales', summary.totalLoss.toFixed(2)],
      ['Pendientes de Validación', summary.pendingValidation.toString()],
      ['Validados', summary.validatedUpdates.toString()],
      ['Rechazados', summary.rejectedUpdates.toString()]
    ]

    autoTable(this.doc, {
      startY: this.currentY,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: this.margin }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addProjectSummarySection(projectSummaries: ProjectSummaryForPDF[]) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Resumen por Proyecto', this.margin, this.currentY)
    this.currentY += 8

    const projectData = projectSummaries.map(project => [
      project.project.name,
      project.totalUpdates.toString(),
      project.totalAmount.toFixed(2),
      project.totalConsumption.toFixed(2),
      project.totalLoss.toFixed(2),
      project.pendingValidation.toString(),
      project.validatedUpdates.toString(),
      project.rejectedUpdates.toString()
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [
        ['Proyecto', 'Actualizaciones', 'Cantidad Total', 'Consumo', 'Pérdida', 'Pendientes', 'Validados', 'Rechazados']
      ],
      body: projectData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: this.margin },
      styles: { fontSize: 8 }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addProgressDetailsSection(progressUpdates: ProgressUpdateForPDF[]) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Detalles de Actualizaciones', this.margin, this.currentY)
    this.currentY += 8

    // Check if we need a new page
    if (this.currentY > 250) {
      this.doc.addPage()
      this.currentY = 20
    }

    const detailsData = progressUpdates.map(update => [
      update.task.name,
      update.project.name,
      update.worker.name,
      update.amountCompleted.toString(),
      update.status,
      update.validationStatus,
      new Date(update.createdAt).toLocaleDateString(),
      update.totalConsumption.toFixed(2),
      update.totalLoss.toFixed(2)
    ])

    autoTable(this.doc, {
      startY: this.currentY,
      head: [
        ['Tarea', 'Proyecto', 'Trabajador', 'Cantidad', 'Estado', 'Validación', 'Fecha', 'Consumo', 'Pérdida']
      ],
      body: detailsData,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: this.margin },
      styles: { fontSize: 7 },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 25 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 },
        4: { cellWidth: 20 },
        5: { cellWidth: 20 },
        6: { cellWidth: 20 },
        7: { cellWidth: 15 },
        8: { cellWidth: 15 }
      }
    })

    this.currentY = (this.doc as any).lastAutoTable.finalY + 15
  }

  private addMaterialDetailsSection(progressUpdates: ProgressUpdateForPDF[]) {
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Detalles de Materiales', this.margin, this.currentY)
    this.currentY += 8

    // Check if we need a new page
    if (this.currentY > 250) {
      this.doc.addPage()
      this.currentY = 20
    }

    const materialData: string[][] = []
    
    progressUpdates.forEach(update => {
      // Add consumption details
      update.materialConsumptions.forEach(consumption => {
        materialData.push([
          update.task.name,
          update.project.name,
          'Consumo',
          consumption.material.name,
          consumption.quantity.toString(),
          consumption.material.unit,
          new Date(update.createdAt).toLocaleDateString()
        ])
      })

      // Add loss details
      update.materialLosses.forEach(loss => {
        materialData.push([
          update.task.name,
          update.project.name,
          'Pérdida',
          loss.material.name,
          loss.quantity.toString(),
          loss.material.unit,
          new Date(update.createdAt).toLocaleDateString()
        ])
      })
    })

    if (materialData.length > 0) {
      autoTable(this.doc, {
        startY: this.currentY,
        head: [
          ['Tarea', 'Proyecto', 'Tipo', 'Material', 'Cantidad', 'Unidad', 'Fecha']
        ],
        body: materialData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202] },
        margin: { left: this.margin },
        styles: { fontSize: 7 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 15 },
          5: { cellWidth: 15 },
          6: { cellWidth: 20 }
        }
      })

      this.currentY = (this.doc as any).lastAutoTable.finalY + 15
    }
  }

  private addFooter() {
    const pageCount = this.doc.getNumberOfPages()
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i)
      
      // Page number
      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(
        `Página ${i} de ${pageCount}`,
        this.pageWidth - this.margin - 30,
        this.doc.internal.pageSize.getHeight() - 10
      )
      
      // Generated date
      this.doc.text(
        `Generado el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        this.margin,
        this.doc.internal.pageSize.getHeight() - 10
      )
    }
  }

  public generateProgressHistoryPDF(
    progressUpdates: ProgressUpdateForPDF[],
    summary: SummaryForPDF,
    projectSummaries: ProjectSummaryForPDF[],
    options: PDFExportOptions
  ): jsPDF {
    // Reset document
    this.doc = new jsPDF('p', 'mm', 'a4')
    this.currentY = 20
    this.pageWidth = this.doc.internal.pageSize.getWidth()

    // Add content
    this.addHeader(options)
    this.addSummarySection(summary)
    this.addProjectSummarySection(projectSummaries)
    this.addProgressDetailsSection(progressUpdates)
    this.addMaterialDetailsSection(progressUpdates)
    this.addFooter()

    return this.doc
  }

  public downloadPDF(filename: string) {
    this.doc.save(filename)
  }
}

// Utility function for easy PDF generation
export const generateProgressHistoryPDF = (
  progressUpdates: ProgressUpdateForPDF[],
  summary: SummaryForPDF,
  projectSummaries: ProjectSummaryForPDF[],
  options: PDFExportOptions
): void => {
  const exporter = new PDFExporter()
  const pdf = exporter.generateProgressHistoryPDF(progressUpdates, summary, projectSummaries, options)
  exporter.downloadPDF(options.title.replace(/\s+/g, '_').toLowerCase() + '_' + new Date().toISOString().split('T')[0] + '.pdf')
}
