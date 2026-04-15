import { Injectable } from "@ubs-platform/neolit/injectables";
import axios, { Axios } from "axios";

// @Injectable()
// export class HttpClient {
//     axiosInstance = axios.create()
// }

@Injectable({
    deps: ["app-axios-instance"],
})
export class BookService {
    readonly baseUrl = "http://localhost:4200/api/exams/book/";
    axiosInstance: Axios;

    constructor(appAxiosInstance: Axios) {
        this.axiosInstance = appAxiosInstance;
    }

    lastThreeBooks() {
        return this.axiosInstance.get(this.baseUrl + "last-three") as Promise<{ data: any[] }>;
    }

    getBooks({bookPublisherType = "ALL"}: { bookPublisherType: "REGISTERED" | "COMMUNITY" | "ALL" }) {
        return this.axiosInstance.get(this.baseUrl + `?bookPublisherType=${bookPublisherType}`) as Promise<{ data: any[] }>;
    }

}