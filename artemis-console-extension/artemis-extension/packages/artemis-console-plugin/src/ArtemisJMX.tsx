/*
 * Licensed to the Apache Software Foundation (ASF) under one or more
 * contributor license agreements.  See the NOTICE file distributed with
 * this work for additional information regarding copyright ownership.
 * The ASF licenses this file to You under the Apache License, Version 2.0
 * (the "License"); you may not use this file except in compliance with
 * the License.  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import Split from 'react-split'
import { ArtemisContext, useArtemisTree } from './context';
import { ArtemisTreeView } from './ArtemisTreeView';
import './artemisJMX.css'
import { ArtemisJmxContent } from './ArtemisJMXContent';


export const ArtemisJMX: React.FunctionComponent = () => {

  const { tree, selectedNode, brokerNode, setSelectedNode, findAndSelectNode } = useArtemisTree();

  return (
      <ArtemisContext.Provider value={{ tree, selectedNode,brokerNode, setSelectedNode, findAndSelectNode }}>
    
        <Split className='artemis-split' sizes={[30, 70]} minSize={200} gutterSize={5}>
          <div>
            <ArtemisTreeView />
          </div>
          <div>
              <ArtemisJmxContent/>
          </div>
        </Split>
      </ArtemisContext.Provider>
  )
}

