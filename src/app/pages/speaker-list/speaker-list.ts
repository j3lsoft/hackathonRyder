import { Router } from '@angular/router';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ApiService } from './../../api.services';
import { Component } from '@angular/core';
import { ConferenceData } from '../../providers/conference-data';
import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner/ngx';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'page-speaker-list',
  templateUrl: 'speaker-list.html',
  styleUrls: ['./speaker-list.scss'],
})
export class SpeakerListPage {
  scannedData: any;
  encodedData: '';
  encodeData: any;
  inputData: any;
  apiData: any;
  truckIdentifier: string;
  inError: boolean;
  form: FormGroup = new FormGroup({
    truckId: new FormControl(''),
  });

  submitted = false;
  constructor(public confData: ConferenceData,private barcodeScanner: BarcodeScanner, private apiService: ApiService, private formBuilder: FormBuilder, private router: Router) {
  }
   
  ngOnInit(): void {
    this.inError = false;
    this.form = this.formBuilder.group({
      truckId: ['', Validators.required],
    });
  }


   
  ValidateTruckId(truckId: string){
        this.apiService.getTruckInformation(truckId).subscribe((data)=>{
              this.apiData = data;                 
              this.inError = false;
              this.router.navigate(["/app/tabs/schedule"],{
                    state: {
                         validationData: this.apiData
                    }
              })
        },(err)=>{
            this.inError = true;       
        });
  }


  scanBarcode() {
    const options: BarcodeScannerOptions = {
      preferFrontCamera: false,
      showFlipCameraButton: true,
      showTorchButton: true,
      torchOn: false,
      prompt: 'Place a barcode inside the scan area',
      resultDisplayDuration: 500,
      formats: 'EAN_13,EAN_8,QR_CODE,PDF_417 ',
      orientation: 'portrait',
    };

    this.barcodeScanner.scan(options).then(barcodeData => {
      console.log('Barcode data', barcodeData);
      this.scannedData = barcodeData;

    }).catch(err => {
      console.log('Error', err);
    });
  }  
  showMessage() {
     window.alert("test")
  }
  createBarcode() {
    this.barcodeScanner.encode(this.barcodeScanner.Encode.TEXT_TYPE, this.inputData).then((encodedData) => {
      console.log(encodedData);
      this.encodedData = encodedData;
    }, (err) => {
      console.log('Error occured : ' + err);
    });
  }
}


