import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { environment } from "../environments/environment";
import { Observable, of } from "rxjs";


@Injectable({
    providedIn: 'root'
})

export class ApiService {
     constructor(private httpClient: HttpClient) { }
     
     getTruckInformation(truckId: string): Observable<any>{
        const url = `${environment.apiBaseUrl}/vehicle/drop-off/${truckId}`;
        return this.httpClient.get<any>(url);
    }

  }