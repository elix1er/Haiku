import { UIMenuListView } from '../../lib/ui_menu_list_view/ui_menu_list_view';
import { UISprite } from '../../lib/ui_sprite/ui_sprite';
import { UIText } from '../../lib/ui_text/ui_text';
import { MenuAxis } from '../../lib/ui_menu/ui_menu';
import { uiManager } from '../../lib/ui/ui_manager';
import { UIWidget } from '../../lib/ui/ui_widget';

class UIPaginedMenuListView<T> extends UIMenuListView<T> {
    nItemPerPages:number;
    curPage:number;
    nextPageIcon:UISprite;
    prevPageIcon:UISprite;
    pageCntText: UIText;
    ctrlVisible:boolean;
    

    constructor(nPages : number) {
      super({axis : MenuAxis.X});
  
      this.myWidgets = new Array<UIWidget>();
      this.nItemPerPages = nPages;
      this.curPage = -1;
  
      this.nextPageIcon = new UISprite();
      this.prevPageIcon = new UISprite();
      this.pageCntText = new UIText();
      this.ctrlVisible = true;
  
      const self=this;
  
      this.nextPageIcon.node.addEventListener('click' , function(){ self.nextPage(); })
      this.prevPageIcon.node.addEventListener('click' , function(){ self.prevPage(); })
  
      uiManager.addWidget(this.pageCntText, 'position:absolute; top:360px; left:40%; right:0; height:40px; width:100px;z-index:1;');
      uiManager.addWidget(this.nextPageIcon, 'position:absolute; top:390px; left:95%; right:0; height:220px; width:20px;background-size: contain;z-index:1;');
      uiManager.addWidget(this.prevPageIcon, 'position:absolute; top:390px; left:2%; right:0; height:220px; width:20px;background-size: contain;z-index:1;');
      this.nextPageIcon.loadTexture("/samples/crazy-cars/ar.png");
      this.prevPageIcon.loadTexture("/samples/crazy-cars/al.png");
      this.node.style.padding='12px';
      
    }
  
    
    setPageForItem(n:number)
    {
      const page = Math.floor(n/this.nItemPerPages);
      if(page != this.curPage)
        this.setPage(page);
    }
  
    nextPage(){
      this.setPage(this.curPage+1)
    }
    prevPage(){
  
      if(this.curPage<=0)
        return;
  
      this.setPage(this.curPage-1);
    }
  
    setPage(n:number) {
  
      this.clear();

      if(this.myWidgets.length<=0)
        return;
  
      const npages = Math.floor(this.myWidgets.length/ this.nItemPerPages)
      this.curPage = (n < npages) ? n : npages;
      
      this.prevPageIcon.node.style.opacity = (this.curPage ==0)? '0.5':'1.0';
      this.nextPageIcon.node.style.opacity = (this.curPage >= npages )?'0.5':'1.0';
      this.pageCntText.setText((this.curPage+1)+ ' / ' + (npages+1));
  
      const firstItem = this.curPage * this.nItemPerPages ;
      const lastItem = Math.min(firstItem + this.nItemPerPages, this.myWidgets.length );
  
      for(let i = firstItem; i < lastItem; i++)
      {
        this.addWidget(this.myWidgets[i], i);
      }
    }
  
    show(s:boolean)
    {
      if((!s)&&(this.ctrlVisible))
      {
        uiManager.removeWidget(this.pageCntText);
        uiManager.removeWidget(this.nextPageIcon);
        uiManager.removeWidget(this.prevPageIcon);
        this.ctrlVisible=false;
  
      }else if(!this.ctrlVisible){
        const self = this;
        uiManager.addWidget(this.pageCntText, 'position:absolute; top:360px; left:40%; right:0; height:40px; width:100px;z-index:1;');
        uiManager.addWidget(this.nextPageIcon, 'position:absolute; top:390px; left:95%; right:0; height:220px; width:20px;background-size: contain;z-index:1;');
        uiManager.addWidget(this.prevPageIcon, 'position:absolute; top:390px; left:2%; right:0; height:220px; width:20px;background-size: contain;z-index:1;');
  
        this.nextPageIcon.node.addEventListener('click' , function(){ self.nextPage(); })
        this.prevPageIcon.node.addEventListener('click' , function(){ self.prevPage(); })
        this.ctrlVisible=true;
      }
  
    }
    myWidgets:Array<UIWidget>;
  }


  export { UIPaginedMenuListView };