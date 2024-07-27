import { AfterContentInit, Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appAutoFocus]',
  standalone: true
})
export class AutoFocusDirective implements AfterContentInit {
  @Input() public autoFocus: boolean | undefined;
  constructor(private el: ElementRef) { }

  public ngAfterContentInit(): void {
    setTimeout(() => {
      this.el.nativeElement.focus();
    }, 100);
  }
}
