import { Component } from '@angular/core';
import { NavController, NavParams, ToastController, LoadingController } from 'ionic-angular';
import { NgForm } from '@angular/forms';
import { AuthHttp } from 'angular2-jwt';
import { UserData } from '../../../providers/user-data';
import { Geolocation} from 'ionic-native';
import * as moment from 'moment';
/*
  Generated class for the KirimStatusProduksi page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
declare var google: any;
@Component({
  selector: 'page-kirim-status-produksi',
  templateUrl: 'kirim-status-produksi.html'
})
export class KirimStatusProduksiPage {
  
  submitted: boolean = false;
  id: string;
  produksi:{
    komoditas_id?: string, 
    alamat?: string, 
    jumlah?: string, 
    satuan?: string, 
    waktu_panen?: any, 
    keterangan?: string, 
    date_tanam?: string, 
    luas_lahan?: number
  } = {};
  lokasi:{lat?: number, lng?: number}={};
  inputAlamat: string;
  dataKomoditas = [];
  useCurrentLocation = false;
  useCurrentLocationColor: string;
  useManualLocationColor: string;
  loading: any;
  date1:string;
  constructor(
  	public navCtrl: NavController,
    public toastCtrl: ToastController, 
    public authHttp: AuthHttp, 
  	public navParams: NavParams,
    public userData: UserData,
    public loadCtrl: LoadingController) {
  }

  ionViewWillEnter() {
    this.userData.getKomoditas().then((value) => {
      this.dataKomoditas = value;
    });
    this.userData.getId().then((value) => {
      this.id = value;
    });
    this.chooseLocation(1);
    this.produksi.waktu_panen = moment(new Date()).format("YYYY-MM-DD");
    this.produksi.date_tanam = moment(new Date()).format("YYYY-MM-DD");
  }

  changeKomoditas(idKomoditas){
     for(let data of this.dataKomoditas){
       if(data.komoditas_id == idKomoditas) {
         this.produksi.satuan = '( '+data.satuan+' )';
         break;
       }
     }
  }
  chooseLocation(target){
    if(target == 1) {
      this.useCurrentLocation = false;
      this.useCurrentLocationColor = "dark";
      this.useManualLocationColor = "default";
    } else if(target == 0) {
      this.getCurrentLocation();
      this.useCurrentLocation = true;
      this.useCurrentLocationColor = "default";
      this.useManualLocationColor = "dark";
    }
  }
  getLatitudeLongitude(address){
    let geocoder = new google.maps.Geocoder();
    geocoder.geocode({'address': address},(results, status)=> {
      if(status=='OK') {
        let lokasi = results[0];
        this.produksi.alamat = address;
        this.lokasi.lat = lokasi.geometry.location.lat();
        this.lokasi.lng = lokasi.geometry.location.lng();
        this.postStatusProduksi();
      } else{
        this.loading.dismiss();
        this.showAlert("Tidak dapat menemukan lokasi anda");
      }
    });
  }
  getAddress(){
    let geocoder = new google.maps.Geocoder();
    let latlng = {lat: this.lokasi.lat, lng: this.lokasi.lng};
    this.produksi.alamat = "";
    geocoder.geocode({'location': latlng},(results, status)=> {
      this.loading.dismiss();
      if(status=='OK') {
        this.produksi.alamat = results[0].formatted_address;
      } else{
        this.showAlert("Tidak dapat menemukan alamat Anda");
      }
    });
  }
  getCurrentLocation(){
    this.loading = this.loadCtrl.create({
        content: 'Tunggu sebentar...'
    });
    this.loading.present();
    Geolocation.getCurrentPosition().then((position) => {
      this.lokasi.lng = position.coords.longitude;
      this.lokasi.lat = position.coords.latitude;
      this.getAddress();
    }, (err) => {
      this.loading.dismiss();
      console.log(err);
    });
  }
  postStatusProduksi(){
    let date_panen = new Date(this.produksi.waktu_panen).getTime();
    let date_tanam = new Date(this.produksi.date_tanam).getTime();
    this.submitted = false;
      let input = JSON.stringify({
        komoditas_id: this.produksi.komoditas_id,
        alamat: this.produksi.alamat,
        latitude: this.lokasi.lat,
        longitude: this.lokasi.lng,
        jumlah: this.produksi.jumlah, 
        keterangan: this.produksi.keterangan,
        date_panen: date_panen,
        date_tanam: date_tanam,
        luas_lahan: this.produksi.luas_lahan
      });
      this.authHttp.post(this.userData.BASE_URL+"produksi/add",input).subscribe(data => {
         this.loading.dismiss();
         let response = data.json();
         if(response.status == '200') {
            this.navCtrl.popToRoot();
            this.showAlert("Status produksi anda telah dikirim");
         }
         
      }, err => {
        this.loading.dismiss();
        this.showError(err);
      });
  }
  submit(form: NgForm) {
    this.submitted = true;
    if (form.valid) {
      this.loading = this.loadCtrl.create({
          content: 'Tunggu sebentar...'
      });
      this.loading.present();
      if(this.useCurrentLocation) {
        this.postStatusProduksi();
      } else{
        this.getLatitudeLongitude(this.inputAlamat);
      }
    }
  }
  showError(err: any){  
    err.status==0? 
    this.showAlert("Tidak ada koneksi. Cek kembali sambungan Internet perangkat Anda"):
    this.showAlert("Tidak dapat menyambungkan ke server. Mohon muat kembali halaman ini");
  }
  showAlert(message: string){
    let toast = this.toastCtrl.create({
      message: message,
      duration: 3000
    });
    toast.present();
  }
}
