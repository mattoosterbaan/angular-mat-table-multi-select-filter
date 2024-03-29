import { Injectable } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { BehaviorSubject } from 'rxjs';

@Injectable()
export class GridFilterService {
  filterValues = {};
  public data = new BehaviorSubject<any>([]);

  constructor(private dataSource: MatTableDataSource<any>) {
    dataSource.connect().subscribe(data => {
        console.log('should update', this.shouldUpdateAvailableValues(dataSource))
        if (this.shouldUpdateAvailableValues(dataSource))
            this.data.next(data);
    });
    dataSource.filterPredicate = this.createFilter();
  }

  private shouldUpdateAvailableValues(dataSource: MatTableDataSource<any>): boolean {
      return dataSource.data === dataSource.filteredData //If these are equal, applied filters are being toggled, so we don't need to change the available filter lists
          || this.data.getValue() !== dataSource.data //If these are not equal, the underlying data is changing (i.e. new data is being set from the uow)
  }

  private createFilter() {
    const filterFunction = function (data: any, filter: string): boolean {
      const searchTerms = JSON.parse(filter);

      const search = () => {
        const rowMatch = [];
        for (const col in searchTerms) {
          if (searchTerms.hasOwnProperty(col)) {
            const columnMatch = [];
            searchTerms[col].forEach((option) => {
              const val = GridFilterService.getProperty(data, col);
              let isMatch = val == option;
              if (val && val?.toString().includes(',')) {
                isMatch = val.includes(option);
              }
              columnMatch.push(isMatch);
            });
            rowMatch.push(columnMatch.some(Boolean));
          }
        }
        return rowMatch.every(Boolean);
        // use .some(Boolean) to use an OR filter
      };
      return search();
    };
    return filterFunction;
  }

  filterChange(fieldName: string, selected) {
    if (selected.length > 0) {
      this.filterValues[fieldName] = selected;
    } else {
      delete this.filterValues[fieldName];
    }
    this.dataSource.filter = JSON.stringify(
      this.filterValues,
      this.customStringify
    );
  }

  customStringify = function (key, value) {
    if (this[key] instanceof Date) {
      // JSON.stringify converts timezone specific dates to UTC. Override this by just using a string.
      return this[key].toString();
    }

    return value;
  };

  // Get unique values from columns to build filter
  private getUnique(fullObj, key: string) {
    const uniqChk = [];
    fullObj.filter((obj) => {
      const prop = GridFilterService.getProperty(obj, key);

      if (Array.isArray(prop)) {
        prop.forEach(function (value) {
          if (!uniqChk.includes(value)) {
            uniqChk.push(value);
          }
        });
      } else {
        if (!this.isInArray(uniqChk, prop)) {
          uniqChk.push(prop);
        }
      }

      return obj;
    });

    return this.sortArray(uniqChk);
  }

  getOptions(fieldName: string) {
    return this.getUnique(this.dataSource.data, fieldName);
  }

  static getProperty(obj, path: string): any[] {
    const separator = '.';
    const properties = Array.isArray(path) ? path : path.split(separator);
    return properties.reduce((prev, curr) => prev && prev[curr], obj);
  }

  private isInArray(array: any[], prop: any) {
    if (prop instanceof Date) {
      return array.some((a) => a?.getTime() === prop?.getTime());
    } else {
      return array.includes(prop);
    }
  }

  private sortArray(array: any[]) {
    return array.sort((n1, n2) => {
      if (Object.prototype.toString.call(n1) === '[object Date]') {
        const date1 = this.tryParseDate(n1, null);
        const date2 = this.tryParseDate(n2, null);

        if (date1 && date2) return date1.getTime() - date2.getTime();
      }

      if (n1 > n2) return 1;
      if (n1 < n2) return -1;
      return 0;
    });
  }

  private tryParseDate(
    str: string,
    defaultValue: string | Date | null
  ): Date | null {
    if (str !== null && str.length > 0) {
      const tried = Date.parse(str);
      if (!isNaN(tried)) return new Date(str);
    }
    if (defaultValue === null) return null;
    if (typeof defaultValue === 'string') {
      const triedDefault = Date.parse(defaultValue);
      if (!isNaN(triedDefault)) return new Date(defaultValue);
    }
    throw 'defaultValue could not be parsed as a date';
  }
}
