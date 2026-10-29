import {useCallback, useEffect, useState} from 'react';
import {Alert, Button, Group, Modal, Select, Stack, TextInput} from '@mantine/core';
import {createBankFolder, getBankFolders} from '../../../../services/questionBank.service.js';

export default function BankFolderSelect({value, onChange, ownerId = '', clearable = false, allowCreate = true, description, label = 'Папка'}) {
    const [folders, setFolders] = useState([]);
    const [opened, setOpened] = useState(false);
    const [name, setName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [loadError, setLoadError] = useState(false);
    const refresh = useCallback(async () => {
        const result = await getBankFolders(ownerId);
        setFolders(result);setLoadError(false);
    }, [ownerId]);
    useEffect(() => {
        let active = true;
        setFolders([]);setLoadError(false);
        const load = () => getBankFolders(ownerId).then(data => {if (active) {setFolders(data);setLoadError(false);}}).catch(() => {if (active) setLoadError(true);});
        load();
        window.addEventListener('question-bank-updated', load);
        return () => {active = false;window.removeEventListener('question-bank-updated', load);};
    }, [ownerId]);
    const names = [...new Set(['Загальна', ...folders.map(folder => folder.name), ...(value ? [value] : [])])];
    const data = names.map(name => {
        const folder = folders.find(entry => entry.name === name);
        return {value: name, label: `${name}${folder ? ` (${folder.count})` : ''}`};
    });
    return <Stack gap={4}>
        <Group align="end" wrap="nowrap">
            <Select label={label} description={description} searchable clearable={clearable} allowDeselect={clearable}
                placeholder={clearable ? 'Усі папки' : 'Оберіть папку'} data={data} value={value || null} onChange={onChange}
                nothingFoundMessage="Папку не знайдено" comboboxProps={{position:'bottom-start'}} style={{flex:1}} />
            {allowCreate && <Button variant="light" onClick={() => {setName('');setError('');setOpened(true);}}>Нова папка</Button>}
        </Group>
        {loadError && <Alert color="orange">Не вдалося завантажити папки. <Button variant="subtle" size="xs" onClick={() => refresh().catch(() => setLoadError(true))}>Повторити</Button></Alert>}
        <Modal opened={opened} onClose={() => {if (!busy) setOpened(false);}} title="Нова папка банку питань" centered>
            <form onSubmit={async event => {
                event.preventDefault();setBusy(true);setError('');
                try {
                    const folder = await createBankFolder(name.trim(), ownerId);
                    onChange(folder.name);setOpened(false);
                    window.dispatchEvent(new Event('question-bank-updated'));
                } catch (error) {setError([error.response?.data?.message || 'Не вдалося створити папку'].flat().join(' '));}
                finally {setBusy(false);}
            }}><Stack>
                <TextInput label="Назва папки" placeholder="Наприклад: Математика 7 клас" value={name} maxLength={100} required onChange={event => setName(event.currentTarget.value)} autoFocus />
                {error && <Alert color="red">{error}</Alert>}
                <Button type="submit" loading={busy} disabled={!name.trim()}>Створити папку</Button>
            </Stack></form>
        </Modal>
    </Stack>;
}
