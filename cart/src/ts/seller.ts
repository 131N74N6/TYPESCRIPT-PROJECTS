import Storage from "./table-storage";
import type { Product } from "./types";

const dataStorage = Storage<Product>("products");
dataStorage.changeSelectedData();