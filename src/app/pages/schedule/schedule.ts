import { Component, ViewChild, OnInit, ElementRef, Inject, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonList, IonRouterOutlet, LoadingController, ModalController, ToastController, Config, Platform } from '@ionic/angular';

import { ScheduleFilterPage } from '../schedule-filter/schedule-filter';
import { ConferenceData } from '../../providers/conference-data';
import { UserData } from '../../providers/user-data';
import { darkStyle } from '../map/map-dark-style'
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'page-schedule',
  templateUrl: 'schedule.html',
  styleUrls: ['./schedule.scss'],
})
export class SchedulePage implements OnInit {
  // Gets a reference to the list element
  @ViewChild('scheduleList', { static: true }) scheduleList: IonList;
  @ViewChild('mapCanvas', { static: true }) mapElement: ElementRef;

  ios: boolean;
  dayIndex = 0;
  queryText = '';
  segment = 'all';
  excludeTracks: any = [];
  shownSessions: any = [];
  groups: any = [];
  confDate: string;
  showSearchbar: boolean;
  validationData: any;
  truckType:string;
  truckYear:string;
  truckVin:string;
  truckImage:string;
  currentLocationObject: any;
  locationAddress:string;
  locationPhone:string;
  locationLat:string;
  locationLong:string;
  customerObject: any;
  customerName:string;
  customerAddress:string;
  customerType:string;
  constructor(
    @Inject(DOCUMENT) private doc: Document,
    public alertCtrl: AlertController,
    public confData: ConferenceData,
    public loadingCtrl: LoadingController,
    public modalCtrl: ModalController,
    public router: Router,
    public routerOutlet: IonRouterOutlet,
    public toastCtrl: ToastController,
    public user: UserData,
    public config: Config,
    public platform: Platform
  ) { }

  ngOnInit() {
    this.updateSchedule();

    this.ios = this.config.get('mode') === 'ios';
    this.validationData = this.router.getCurrentNavigation().extras.state.validationData;
    this.truckType = this.validationData.truck.model;
    this.truckYear = this.validationData.truck.year;
    this.truckVin = this.validationData.truck.vinNumber;
    this.truckImage = `../../../assets/img/${this.validationData.truck.modelId}.jpg`;
    this.currentLocationObject = this.validationData.currentRentalLocation;
    this.customerObject = this.validationData.customer;
    this.customerName = this.customerObject.name;
    this.customerAddress = this.customerObject.address;
    this.customerType = this.customerObject.type;
     if(this.currentLocationObject!=null) { 
          this.locationAddress = this.currentLocationObject.address;
          this.locationPhone = this.currentLocationObject.phone;
          this.locationLat = this.currentLocationObject.latitude;
          this.locationLong = this.currentLocationObject.longitude;
     }else{
         window.alert("no esta en la yarda");
     }
  }


  async ngAfterViewInit() {
    const appEl = this.doc.querySelector('ion-content');
    let isDark = false;
    let style = [];
    if (appEl.classList.contains('dark-theme')) {
      style = darkStyle;
    }

    const googleMaps = await getGoogleMaps(
      'AIzaSyCwNU-0dn-IvJiimHYPrGKZ2UIvGoog-_E'
    );

    let map;

    this.confData.getMap().subscribe((mapData: any) => {
      const mapEle = this.mapElement.nativeElement;

      map = new googleMaps.Map(mapEle, {
        center: mapData.find((d: any) => d.center),
        zoom: 16,
        styles: style
      });

      mapData.forEach((markerData: any) => {
        const infoWindow = new googleMaps.InfoWindow({
          content: `<h5>${markerData.name}</h5>`
        });

        var locations = [
          ['Illinois',this.locationLat, this.locationLong,'http://labs.google.com/ridefinder/images/mm_20_purple.png'],
          ['Sausalito', 37.8590937, -122.4852507,'http://labs.google.com/ridefinder/images/mm_20_red.png'],
          ['Sacramento', 38.5815719, -121.4943996,'http://labs.google.com/ridefinder/images/mm_20_green.png'],
          ['Soledad', 36.424687, -121.3263187,'http://labs.google.com/ridefinder/images/mm_20_blue.png'],
          ['Shingletown', 40.4923784, -121.8891586,'http://labs.google.com/ridefinder/images/mm_20_yellow.png']
      ];
        
        const marker = new googleMaps.Marker({
          position: new googleMaps.LatLng(locations[0][1], locations [0][2]),
          map,
          title: locations[0][0],
          icon: [0][3]
        });

        marker.addListener('click', () => {
          infoWindow.open(map, marker);
        });
      });

      googleMaps.event.addListenerOnce(map, 'idle', () => {
        mapEle.classList.add('show-map');
      });
    });

    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const el = mutation.target as HTMLElement;
          isDark = el.classList.contains('dark-theme');
          if (map && isDark) {
            map.setOptions({styles: darkStyle});
          } else if (map) {
            map.setOptions({styles: []});
          }
        }
      });
    });
    observer.observe(appEl, {
      attributes: true
    });
  }

  updateSchedule() {
    // Close any open sliding items when the schedule updates
    if (this.scheduleList) {
      this.scheduleList.closeSlidingItems();
    }

    this.confData.getTimeline(this.dayIndex, this.queryText, this.excludeTracks, this.segment).subscribe((data: any) => {
      this.shownSessions = data.shownSessions;
      this.groups = data.groups;
    });
  }

  async presentFilter() {
    const modal = await this.modalCtrl.create({
      component: ScheduleFilterPage,
      swipeToClose: true,
      presentingElement: this.routerOutlet.nativeEl,
      componentProps: { excludedTracks: this.excludeTracks }
    });
    await modal.present();

    const { data } = await modal.onWillDismiss();
    if (data) {
      this.excludeTracks = data;
      this.updateSchedule();
    }
  }

  async addFavorite(slidingItem: HTMLIonItemSlidingElement, sessionData: any) {
    if (this.user.hasFavorite(sessionData.name)) {
      // Prompt to remove favorite
      this.removeFavorite(slidingItem, sessionData, 'Favorite already added');
    } else {
      // Add as a favorite
      this.user.addFavorite(sessionData.name);

      // Close the open item
      slidingItem.close();

      // Create a toast
      const toast = await this.toastCtrl.create({
        header: `${sessionData.name} was successfully added as a favorite.`,
        duration: 3000,
        buttons: [{
          text: 'Close',
          role: 'cancel'
        }]
      });

      // Present the toast at the bottom of the page
      await toast.present();
    }

  }

  async removeFavorite(slidingItem: HTMLIonItemSlidingElement, sessionData: any, title: string) {
    const alert = await this.alertCtrl.create({
      header: title,
      message: 'Would you like to remove this session from your favorites?',
      buttons: [
        {
          text: 'Cancel',
          handler: () => {
            // they clicked the cancel button, do not remove the session
            // close the sliding item and hide the option buttons
            slidingItem.close();
          }
        },
        {
          text: 'Remove',
          handler: () => {
            // they want to remove this session from their favorites
            this.user.removeFavorite(sessionData.name);
            this.updateSchedule();

            // close the sliding item and hide the option buttons
            slidingItem.close();
          }
        }
      ]
    });
    // now present the alert on top of all other content
    await alert.present();
  }

  async openSocial(network: string, fab: HTMLIonFabElement) {
    const loading = await this.loadingCtrl.create({
      message: `Posting to ${network}`,
      duration: (Math.random() * 1000) + 500
    });
    await loading.present();
    await loading.onWillDismiss();
    fab.close();
  }
}
function getGoogleMaps(apiKey: string): Promise<any> {
  const win = window as any;
  const googleModule = win.google;
  if (googleModule && googleModule.maps) {
    return Promise.resolve(googleModule.maps);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=3.31`;
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);
    script.onload = () => {
      const googleModule2 = win.google;
      if (googleModule2 && googleModule2.maps) {
        resolve(googleModule2.maps);
      } else {
        reject('google maps not available');
      }
    };
  });
}