import { Component, OnInit, Input, EventEmitter, Output, OnChanges } from '@angular/core';

@Component({
  selector: 'app-grid-filter',
  templateUrl: './grid-filter.component.html',
  styleUrls: ['./grid-filter.component.css']
})
export class GridFilterComponent implements OnInit, OnChanges {
  
  selected: any[] = [];
  options: any[] = [];
  @Input() fieldName: string;
  @Input() data: any[];
  @Output() filterChange = new EventEmitter<{fieldName: string, selected: any}>()

  constructor() { }

  ngOnInit() {
      //this.data$.subscribe(d => {
      //  this.options = this.getUnique(d, this.fieldName);        
      //})
  }

  ngOnChanges() {
    this.options =  this.getUnique(this.data, this.fieldName);  
  }
  
  // Get unique values from columns to build filter
  getUnique(fullObj, key: string) {
    console.log(fullObj.typeof);
    const uniqChk = [];
    fullObj.filter((obj) => {
      if (!uniqChk.includes(obj[key])) {
        uniqChk.push(obj[key]);
      }
      return obj;
    });
    return uniqChk;
  }

  filterChanged() {
    this.filterChange.emit({fieldName: this.fieldName, selected: this.selected});
  }

  //TODO this is not working right
  onSelectAll(selectAll: Boolean) {
    if (selectAll) {
      this.selected = this.options;
    } else {
      this.selected = [];
    }
    this.filterChanged();
  }

}