import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InvoiceTemplate, InvoiceTemplateService } from './invoice-template.service';

@Component({
  selector: 'app-invoice-template-editor', standalone: true, imports: [CommonModule, FormsModule],
  template: `
    <div class="editor-backdrop"><section class="editor-card" (click)="$event.stopPropagation()">
      <header><div><h2>Invoice template</h2><p>Edit the exact text and styling used in this invoice PDF.</p></div><button class="close" type="button" (click)="cancel.emit()">×</button></header>
      <div class="editor-body"><div class="workspace">
        <div class="controls">
          <label>Logo<input type="file" accept="image/*" (change)="onLogo($event)" /></label>
          <label>Signature image<input type="file" accept="image/*" (change)="onSignature($event)" /></label>
          <div class="style-fields"><label>Primary color<input type="color" [(ngModel)]="template.primaryColor" /></label><label>Accent color<input type="color" [(ngModel)]="template.accentColor" /></label><label>Logo width<input type="number" min="20" max="90" [(ngModel)]="template.logoWidth" /></label></div>
          <div class="fields">
            <label>Company name<input [(ngModel)]="template.companyName" /></label><label>Invoice label<input [(ngModel)]="template.invoiceLabel" /></label>
            <label class="wide">Company address<textarea [(ngModel)]="template.companyAddress"></textarea></label>
            <label>Company email<input [(ngModel)]="template.companyEmail" /></label><label>Company website<input [(ngModel)]="template.companyWebsite" /></label>
            <label>PAN number<input [(ngModel)]="template.panNumber" /></label><label>Invoice date text<input [(ngModel)]="template.invoiceDateLabel" /></label>
            <label>GSTIN<input [(ngModel)]="template.gstin" /></label>
            <label>Place of supply<input [(ngModel)]="template.placeOfSupply" /></label><label>HSN / SAC<input [(ngModel)]="template.hsnSac" /></label>
            <label>Bill-to label<input [(ngModel)]="template.billToLabel" /></label><label>Grand total label<input [(ngModel)]="template.grandTotalLabel" /></label>
            <label class="wide">Bank details<textarea [(ngModel)]="template.bankDetails"></textarea></label>
            <label>Bank name<input [(ngModel)]="template.bankName" /></label><label>Account name<input [(ngModel)]="template.accountName" /></label>
            <label>Account number<input [(ngModel)]="template.accountNumber" /></label><label>IFSC code<input [(ngModel)]="template.ifscCode" /></label>
            <label>Branch<input [(ngModel)]="template.branch" /></label><label>Swift code<input [(ngModel)]="template.swiftCode" /></label>
            <label class="wide">Export declaration<textarea [(ngModel)]="template.exportDeclaration"></textarea></label>
            <label class="wide">Terms and conditions<textarea [(ngModel)]="template.terms"></textarea></label>
            <label>Signature label<input [(ngModel)]="template.signatureLabel" /></label><label class="wide">Footer text<input [(ngModel)]="template.footerText" /></label>
          </div>
        </div>
        <div class="preview"><div class="paper" [style.--primary]="template.primaryColor" [style.--accent]="template.accentColor">
          <img class="logo" [style.width.px]="template.logoWidth" [src]="template.logoDataUrl || '/assets/kogzio-logo.png'" /><div class="preview-title">{{ template.invoiceLabel }}</div><small># {{ invoiceNo }}<br>{{ invoiceDate || template.invoiceDateLabel }}</small><hr>
          <strong>{{ template.companyName }}</strong><p>{{ template.companyAddress }}</p><p>PAN: {{ template.panNumber }}<br>{{ template.companyEmail }}<br>{{ template.companyWebsite }}<br>{{ template.placeOfSupply }}</p><div class="red-line"></div>
          <div class="preview-table"><b>Service Description</b><b>HSN/SAC</b><b>Qty</b><b>{{ template.amountLabel }}</b><span>{{ template.serviceDescription }}</span><span>{{ template.hsnSac }}</span><span>1</span><span>&#36;{{ invoiceAmount.toFixed(2) }}</span></div>
          <div class="total">{{ template.grandTotalLabel }} <b>&#36;{{ invoiceAmount.toFixed(2) }}</b></div><p>{{ template.exportDeclaration }}</p><p>{{ template.bankDetails }}<br>{{ template.bankName }} · {{ template.accountNumber }} · {{ template.ifscCode }}</p><p>{{ template.terms }}</p>
          @if (template.signatureDataUrl) { <img class="signature" [src]="template.signatureDataUrl" /> }<footer>{{ template.footerText }}</footer>
        </div></div>
      </div></div>
      <footer><button class="reset" type="button" (click)="reset()">Reset defaults</button><span></span><button class="cancel" type="button" (click)="cancel.emit()">Cancel</button><button class="save" type="button" (click)="save()">Save template</button></footer>
    </section></div>
  `,
  styles: [`
    .editor-backdrop { background:rgba(0,0,0,.4); inset:0; position:fixed; z-index:80; display:grid; place-items:center; }
    .editor-card { background:#fff; border-radius:8px; display:flex; flex-direction:column; max-height:92vh; overflow:hidden; width:min(1120px,calc(100vw - 32px)); }
    header,footer { align-items:center; display:flex; gap:12px; padding:18px 20px; } header { border-bottom:1px solid #eee; } footer { border-top:1px solid #eee; } header span,footer span { flex:1; }
    h2,p { margin:0; } h2 { color:#292934; font-size:18px; } header p { color:#777782; font-size:12px; margin-top:4px; } .close { background:none; border:0; color:#777782; cursor:pointer; font-size:25px; }
    .editor-body { overflow:auto; padding:18px 20px; } label { color:#4b4b55; display:grid; font-size:12px; gap:5px; } input,textarea { border:1px solid #ddd; border-radius:5px; font:inherit; padding:8px; } textarea { min-height:58px; resize:vertical; }
    .workspace { display:grid; grid-template-columns:minmax(0,1fr) 390px; gap:20px; } .fields { display:grid; gap:12px; grid-template-columns:1fr 1fr; margin-top:15px; } .wide { grid-column:1/-1; } .style-fields { display:grid; gap:12px; grid-template-columns:repeat(3,1fr); margin-top:12px; } input[type=color] { height:35px; padding:3px; }
    .preview { background:#eef0f3; padding:12px; } .paper { --primary:#123a67; --accent:#c4372a; background:#fff; box-shadow:0 2px 10px #0002; color:#333; font-size:8px; min-height:510px; padding:18px; } .logo { height:42px; object-fit:contain; object-position:left; } .preview-title { color:var(--primary); float:right; font-size:20px; font-weight:bold; } .paper hr { border:0; border-top:2px solid var(--primary); clear:both; margin:15px 0; } .paper p { margin:6px 0; white-space:pre-line; } .red-line { border-top:2px solid var(--accent); margin:18px 0; } .preview-table { background:var(--primary); color:#fff; display:grid; gap:5px; grid-template-columns:1fr 55px 25px 55px; padding:6px; } .preview-table span { background:#fff; color:#333; padding:5px; } .total { background:var(--primary); color:#fff; margin-top:5px; padding:8px; text-align:right; } .total b { margin-left:35px; } .signature { display:block; height:35px; object-fit:contain; margin:8px auto; width:110px; } .paper footer { border-top:2px solid var(--primary); font-size:7px; margin-top:35px; padding-top:8px; text-align:center; }
    button { border-radius:5px; cursor:pointer; font:inherit; font-size:12px; padding:8px 12px; } .reset,.cancel { background:#fff; border:1px solid #ddd; color:#555; } .save { background:#464feb; border:1px solid #464feb; color:#fff; }
    @media(max-width:800px) { .workspace { grid-template-columns:1fr; } .fields,.style-fields { grid-template-columns:1fr; } .wide { grid-column:auto; } }
  `],
})
export class InvoiceTemplateEditor implements OnInit {
  @Input() invoiceKey = 'default';
  @Input() invoiceLabel = '';
  @Input() invoiceNo = 'INV-501-2026-001';
  @Input() customerName = 'Customer';
  @Input() invoiceAmount = 800;
  @Input() invoiceDate = '';
  @Output() cancel = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();
  private service = inject(InvoiceTemplateService);
  template!: InvoiceTemplate;
  ngOnInit() { this.template = this.service.getTemplate(this.invoiceKey); }
  onLogo(event: Event) { this.readImage(event, (value) => this.template.logoDataUrl = value); }
  onSignature(event: Event) { this.readImage(event, (value) => this.template.signatureDataUrl = value); }
  private readImage(event: Event, set: (value: string) => void) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; const reader = new FileReader(); reader.onload = () => set(String(reader.result)); reader.readAsDataURL(file); }
  reset() { this.template = this.service.resetTemplate(this.invoiceKey); }
  save() { this.service.saveTemplate(this.template, this.invoiceKey); this.saved.emit(); }
}
